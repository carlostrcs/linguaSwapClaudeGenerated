using System.Text;
using System.Text.Json.Serialization;
using LinguaSwap.Api.Data;
using LinguaSwap.Api.Models;
using LinguaSwap.Api.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
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
    })
    .AddEntityFrameworkStores<AppDbContext>()
    .AddDefaultTokenProviders();

// JWT bearer authentication.
var jwt = builder.Configuration.GetSection("Jwt");
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
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwt["Key"]!)),
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

// CORS: allow the Vite dev server (frontend) to call this API during development.
const string FrontendCors = "frontend";
builder.Services.AddCors(options =>
{
    options.AddPolicy(FrontendCors, policy =>
        policy.WithOrigins("http://localhost:5173")
              .AllowAnyHeader()
              .AllowAnyMethod());
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
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors(FrontendCors);

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
