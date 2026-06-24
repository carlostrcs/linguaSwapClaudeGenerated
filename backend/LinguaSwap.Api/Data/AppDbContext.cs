using LinguaSwap.Api.Models;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace LinguaSwap.Api.Data;

public class AppDbContext : IdentityDbContext<ApplicationUser>
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Library> Libraries => Set<Library>();
    public DbSet<Entry> Entries => Set<Entry>();
    public DbSet<Translation> Translations => Set<Translation>();
    public DbSet<LearningState> LearningStates => Set<LearningState>();
    public DbSet<PracticeSession> PracticeSessions => Set<PracticeSession>();
    public DbSet<Attempt> Attempts => Set<Attempt>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        // Cascade tree: each entity has a single cascade parent. Cross-references
        // (PracticeSession.Library, Attempt.Entry) use SetNull so history survives
        // a library/entry deletion and we avoid multiple cascade paths.

        builder.Entity<Library>(e =>
        {
            e.Property(l => l.Name).IsRequired().HasMaxLength(200);
            e.Property(l => l.Description).HasMaxLength(2000);
            e.HasOne(l => l.User)
                .WithMany(u => u.Libraries)
                .HasForeignKey(l => l.UserId)
                .OnDelete(DeleteBehavior.Cascade);
            e.HasIndex(l => l.UserId);
        });

        builder.Entity<Entry>(e =>
        {
            e.Property(x => x.Notes).HasMaxLength(2000);
            e.HasOne(x => x.Library)
                .WithMany(l => l.Entries)
                .HasForeignKey(x => x.LibraryId)
                .OnDelete(DeleteBehavior.Cascade);
            e.HasIndex(x => x.LibraryId);
        });

        builder.Entity<Translation>(e =>
        {
            e.Property(t => t.LanguageCode).IsRequired().HasMaxLength(10);
            e.Property(t => t.Text).IsRequired().HasMaxLength(500);
            e.HasOne(t => t.Entry)
                .WithMany(x => x.Translations)
                .HasForeignKey(t => t.EntryId)
                .OnDelete(DeleteBehavior.Cascade);
            // One translation per language per entry.
            e.HasIndex(t => new { t.EntryId, t.LanguageCode }).IsUnique();
        });

        builder.Entity<LearningState>(e =>
        {
            e.Property(s => s.SourceLanguage).IsRequired().HasMaxLength(10);
            e.Property(s => s.TargetLanguage).IsRequired().HasMaxLength(10);
            e.HasOne(s => s.Entry)
                .WithMany(x => x.LearningStates)
                .HasForeignKey(s => s.EntryId)
                .OnDelete(DeleteBehavior.Cascade);
            // One learning state per entry per direction.
            e.HasIndex(s => new { s.EntryId, s.SourceLanguage, s.TargetLanguage }).IsUnique();
            e.HasIndex(s => s.NextReviewAt);
        });

        builder.Entity<PracticeSession>(e =>
        {
            e.Property(s => s.SourceLanguage).IsRequired().HasMaxLength(10);
            e.Property(s => s.TargetLanguage).IsRequired().HasMaxLength(10);
            e.Property(s => s.Difficulty).HasConversion<string>().HasMaxLength(20);
            e.HasOne(s => s.User)
                .WithMany(u => u.PracticeSessions)
                .HasForeignKey(s => s.UserId)
                .OnDelete(DeleteBehavior.Cascade);
            e.HasOne(s => s.Library)
                .WithMany()
                .HasForeignKey(s => s.LibraryId)
                .OnDelete(DeleteBehavior.SetNull);
            e.HasIndex(s => s.UserId);
        });

        builder.Entity<Attempt>(e =>
        {
            e.Property(a => a.Prompt).IsRequired().HasMaxLength(500);
            e.Property(a => a.ExpectedAnswer).IsRequired().HasMaxLength(500);
            e.Property(a => a.UserAnswer).HasMaxLength(500);
            e.HasOne(a => a.Session)
                .WithMany(s => s.Attempts)
                .HasForeignKey(a => a.SessionId)
                .OnDelete(DeleteBehavior.Cascade);
            e.HasOne(a => a.Entry)
                .WithMany()
                .HasForeignKey(a => a.EntryId)
                .OnDelete(DeleteBehavior.SetNull);
            e.HasIndex(a => a.SessionId);
        });
    }
}
