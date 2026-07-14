using System.Text;
using System.Text.Json.Serialization;
using System.Threading.RateLimiting;
using LinguaSwap.Api.Data;
using LinguaSwap.Api.Models;
using LinguaSwap.Api.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi;

var builder = WebApplication.CreateBuilder(args);

// Database: EF Core over PostgreSQL (Supabase in prod, local Docker in dev).
// EnableRetryOnFailure adds resiliency against transient cloud-network drops.
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(
        builder.Configuration.GetConnectionString("Default"),
        npgsql => npgsql.EnableRetryOnFailure()));

// Identity: user accounts + password hashing, stored via EF Core.
builder.Services
    .AddIdentityCore<ApplicationUser>(options =>
    {
        options.User.RequireUniqueEmail = true;
        // Reject too-simple passwords: 8+ chars with a mix of upper, lower, and a digit.
        // Symbols stay optional to avoid over-frustrating a learning app.
        options.Password.RequiredLength = 8;
        options.Password.RequireNonAlphanumeric = false;
        options.Password.RequireUppercase = true;
        options.Password.RequireLowercase = true;
        options.Password.RequireDigit = true;

        // Brute-force protection: lock an account after repeated bad passwords. AuthController.Login
        // drives this explicitly (AccessFailedAsync / IsLockedOutAsync) — UserManager.CheckPasswordAsync
        // on its own does NOT touch the lockout counters.
        options.Lockout.MaxFailedAccessAttempts = 5;
        options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(15);
        options.Lockout.AllowedForNewUsers = true;
    })
    .AddEntityFrameworkStores<AppDbContext>()
    .AddDefaultTokenProviders();

// JWT bearer authentication.
var jwt = builder.Configuration.GetSection("Jwt");

// The signing key is the whole ballgame: anyone who knows it can mint a token for any user.
// appsettings.json ships a *committed* dev placeholder, so in Production we refuse to boot unless
// a real key was supplied (via the Jwt__Key env var). Crashing on deploy is far better than
// silently running a forgeable auth system.
const string DevJwtKey = "dev-only-secret-key-change-me-please-at-least-32-bytes!";
var jwtKey = jwt["Key"];
if (string.IsNullOrWhiteSpace(jwtKey))
    throw new InvalidOperationException("Jwt:Key is not configured.");
if (!builder.Environment.IsDevelopment())
{
    if (jwtKey == DevJwtKey)
        throw new InvalidOperationException(
            "Jwt:Key is still the committed development placeholder. Set a unique secret via the " +
            "Jwt__Key environment variable before running outside Development.");
    if (Encoding.UTF8.GetByteCount(jwtKey) < 32)
        throw new InvalidOperationException(
            "Jwt:Key must be at least 32 bytes. Generate one with: openssl rand -base64 48");
}

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = jwt["Issuer"],
            ValidateAudience = true,
            ValidAudience = jwt["Audience"],
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
            ValidateLifetime = true,
            ClockSkew = TimeSpan.FromSeconds(30)
        };
    });
builder.Services.AddAuthorization();

builder.Services.AddScoped<TokenService>();
builder.Services.AddScoped<RefreshTokenService>();
builder.Services.AddScoped<PremiumService>();

// Email: transactional mail (account confirmation) over SMTP. Real credentials come from
// user-secrets / env vars; with none configured the sender logs the message instead.
builder.Services.AddScoped<IEmailSender, SmtpEmailSender>();
builder.Services.AddScoped<EmailConfirmationService>();

// Stripe (premium subscriptions). The secret key is global SDK config; real values come
// from user-secrets / env vars (appsettings ships empty placeholders).
Stripe.StripeConfiguration.ApiKey = builder.Configuration["Stripe:SecretKey"];
builder.Services.AddScoped<StripeService>();

// Practice domain services (stateless, unit-testable).
builder.Services.AddSingleton<LeitnerService>();
builder.Services.AddSingleton<AnswerChecker>();
builder.Services.AddSingleton<HintService>();

// Practice systems: one selector per PracticeMode, resolved by PracticeSelectorResolver.
builder.Services.AddSingleton<IPracticeSelector, SmartReviewSelector>();
builder.Services.AddSingleton<IPracticeSelector, LearnNewSelector>();
builder.Services.AddSingleton<IPracticeSelector, CramSelector>();
builder.Services.AddSingleton<IPracticeSelector, WeakSelector>();
builder.Services.AddSingleton<IPracticeSelector, JourneySelector>();
builder.Services.AddSingleton<PracticeSelectorResolver>();

// CORS: config-driven so the deployed frontend can call the API. Set the production origin with
// Cors__AllowedOrigins__0=https://<your-domain>; with nothing configured we fall back to the Vite
// dev server. A hardcoded origin here would block every real browser in production.
const string FrontendCors = "frontend";
var corsOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>();
if (corsOrigins is null || corsOrigins.Length == 0)
    corsOrigins = ["http://localhost:5173"];
builder.Services.AddCors(options =>
{
    options.AddPolicy(FrontendCors, policy =>
        policy.WithOrigins(corsOrigins)
              .AllowAnyHeader()
              .AllowAnyMethod());
});

// Rate limiting on the auth endpoints: throttles password guessing, registration spam, and the
// (otherwise unbounded) confirmation-email send path. Applied via [EnableRateLimiting] on AuthController.
const string AuthRateLimit = "auth";
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.AddFixedWindowLimiter(AuthRateLimit, o =>
    {
        o.PermitLimit = 10;
        o.Window = TimeSpan.FromMinutes(1);
        o.QueueLimit = 0;
    });
});

// Health checks. /health/ready actually opens a DB connection, so the host can restart an instance
// whose database is unreachable — the old static "ok" reported healthy while Postgres was down.
builder.Services.AddHealthChecks().AddDbContextCheck<AppDbContext>();

// Consistent RFC-7807 error bodies (with a trace id) instead of an opaque empty 500.
builder.Services.AddProblemDetails();

// Behind Render's TLS-terminating proxy the app sees plain HTTP; these headers carry the real
// scheme and client IP. The proxy's IP isn't known ahead of time, hence the cleared allow-lists.
builder.Services.Configure<ForwardedHeadersOptions>(options =>
{
    options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
    options.KnownNetworks.Clear();
    options.KnownProxies.Clear();
});

builder.Services
    .AddControllers()
    .AddJsonOptions(o => o.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter()));

// Return DataAnnotation validation failures (e.g. a malformed email) in the same
// { message, errors } shape the frontend's ApiError reads, instead of the default
// ValidationProblemDetails the client can't surface.
builder.Services.Configure<ApiBehaviorOptions>(options =>
{
    options.InvalidModelStateResponseFactory = context =>
    {
        var errors = context.ModelState.Values
            .SelectMany(v => v.Errors)
            .Select(e => e.ErrorMessage)
            .Where(m => !string.IsNullOrWhiteSpace(m))
            .ToArray();
        var message = errors.Length > 0 ? string.Join(" ", errors) : "Invalid request.";
        return new BadRequestObjectResult(new { message, errors });
    };
});

// Swagger / OpenAPI: interactive UI at /swagger, with a JWT "Authorize" button.
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Paste your JWT here (the Swagger UI adds the 'Bearer ' prefix)."
    });
    options.AddSecurityRequirement(_ => new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecuritySchemeReference("Bearer"),
            new List<string>()
        }
    });
});

var app = builder.Build();

// Apply any pending EF Core migrations and seed demo data on startup (local dev).
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.Migrate();
    await DbSeeder.SeedAsync(scope.ServiceProvider);
}

// Configure the HTTP request pipeline.

// Must run before anything that reads the scheme or client IP.
app.UseForwardedHeaders();

// Turns an unhandled exception into a ProblemDetails body with a trace id, rather than a bare 500.
app.UseExceptionHandler();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}
else
{
    // Tell browsers to stick to HTTPS. We deliberately do NOT call UseHttpsRedirection(): the host
    // (Render) already terminates TLS and redirects http->https at its edge, and an in-app redirect
    // would 307 the platform's *internal* HTTP health probe — failing the check and restart-looping
    // the service.
    app.UseHsts();
}

app.UseCors(FrontendCors);

app.UseRateLimiter();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// Liveness: process is up. Readiness: process is up AND the database answers (point the host's
// health check at /health/ready).
app.MapHealthChecks("/health/live", new() { Predicate = _ => false });
app.MapHealthChecks("/health/ready");

app.Run();
