using LinguaSwap.Api.Data;
using LinguaSwap.Api.Models;
using LinguaSwap.Api.Services;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace LinguaSwap.Tests;

/// <summary>
/// Covers effective-premium (paid OR active trial), the one-time trial, and the free-tier
/// visibility caps (hide-when-free / reappear-when-premium) against a real in-memory SQLite
/// AppDbContext.
/// </summary>
public class PremiumServiceTests : IDisposable
{
    private readonly SqliteConnection _connection;
    private readonly AppDbContext _db;
    private readonly PremiumService _premium;

    public PremiumServiceTests()
    {
        _connection = new SqliteConnection("DataSource=:memory:");
        _connection.Open();
        _db = new AppDbContext(new DbContextOptionsBuilder<AppDbContext>()
            .UseSqlite(_connection)
            .Options);
        _db.Database.EnsureCreated();
        _premium = new PremiumService(_db);
    }

    public void Dispose()
    {
        _db.Dispose();
        _connection.Dispose();
    }

    // --- HasPremiumAccess (pure, no DB) -------------------------------------------------

    [Fact]
    public void HasPremiumAccess_TrueForPaid_EvenWithoutTrial()
    {
        var user = new ApplicationUser { IsPremium = true };
        Assert.True(user.HasPremiumAccess(DateTime.UtcNow));
    }

    [Fact]
    public void HasPremiumAccess_TrueWhileTrialActive()
    {
        var now = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc);
        var user = new ApplicationUser { TrialEndsAt = now.AddDays(1) };
        Assert.True(user.HasPremiumAccess(now));
    }

    [Fact]
    public void HasPremiumAccess_FalseWhenTrialExpiredAndUnpaid()
    {
        var now = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc);
        var user = new ApplicationUser { TrialStartedAt = now.AddDays(-20), TrialEndsAt = now.AddDays(-6) };
        Assert.False(user.HasPremiumAccess(now));
    }

    [Fact]
    public void HasPremiumAccess_FalseWhenNeverTrialedAndUnpaid()
    {
        Assert.False(new ApplicationUser().HasPremiumAccess(DateTime.UtcNow));
    }

    // --- IsPremiumAsync -----------------------------------------------------------------

    [Fact]
    public async Task IsPremiumAsync_ReflectsActiveTrial()
    {
        var user = AddUser("trial", trialEnds: DateTime.UtcNow.AddDays(3));
        Assert.True(await _premium.IsPremiumAsync(user.Id));
    }

    [Fact]
    public async Task IsPremiumAsync_FalseAfterTrialExpires()
    {
        var user = AddUser("expired", trialEnds: DateTime.UtcNow.AddDays(-1));
        Assert.False(await _premium.IsPremiumAsync(user.Id));
    }

    // --- StartTrialAsync ----------------------------------------------------------------

    [Fact]
    public async Task StartTrialAsync_SetsFourteenDayWindow_Once()
    {
        var user = AddUser("newbie");
        var now = new DateTime(2026, 6, 1, 12, 0, 0, DateTimeKind.Utc);

        Assert.True(await _premium.StartTrialAsync(user.Id, now));
        await _db.Entry(user).ReloadAsync();
        Assert.Equal(now, user.TrialStartedAt);
        Assert.Equal(now.AddDays(PremiumService.TrialDays), user.TrialEndsAt);

        // A second attempt is a no-op — the trial can never be started twice.
        Assert.False(await _premium.StartTrialAsync(user.Id, now.AddDays(60)));
        await _db.Entry(user).ReloadAsync();
        Assert.Equal(now.AddDays(PremiumService.TrialDays), user.TrialEndsAt);
    }

    // --- Visibility caps ----------------------------------------------------------------

    [Fact]
    public async Task VisibleLibraries_FreeUserSeesOldestFiveOnly()
    {
        var user = AddUser("free");
        var baseTime = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc);
        var created = new List<Library>();
        for (var i = 0; i < 7; i++) created.Add(AddLibrary(user.Id, baseTime.AddMinutes(i)));

        var free = await _premium.VisibleLibraries(user.Id, isPremium: false)
            .Select(l => l.Id).ToListAsync();
        var premium = await _premium.VisibleLibraries(user.Id, isPremium: true)
            .Select(l => l.Id).ToListAsync();

        Assert.Equal(PremiumService.FreeLibraryLimit, free.Count);
        // The five kept are the oldest-created (first five ids).
        Assert.Equal(created.Take(5).Select(l => l.Id).OrderBy(x => x), free.OrderBy(x => x));
        Assert.Equal(7, premium.Count);
    }

    [Fact]
    public async Task VisibleEntries_FreeUserSeesOldestFiveHundredOnly()
    {
        var user = AddUser("free");
        var lib = AddLibrary(user.Id, DateTime.UtcNow);
        var total = PremiumService.FreeWordsPerLibrary + 3;
        for (var i = 0; i < total; i++) _db.Entries.Add(new Entry { LibraryId = lib.Id });
        await _db.SaveChangesAsync();

        var free = await _premium.VisibleEntries(lib.Id, isPremium: false).CountAsync();
        var premium = await _premium.VisibleEntries(lib.Id, isPremium: true).CountAsync();

        Assert.Equal(PremiumService.FreeWordsPerLibrary, free);
        Assert.Equal(total, premium);
    }

    [Fact]
    public async Task VisibleLibraries_ComposesWithTheShapesTheControllersUse()
    {
        // Guards the EF translations layered on top of the free-tier Take(): OrderByDescending
        // (Libraries.List), Any(id) membership (Get/Update/Delete/Practice guards), and
        // Any(l => l.Entries.Any(...)) (the entry-visibility guard).
        var user = AddUser("free");
        var baseTime = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc);
        var libs = new List<Library>();
        for (var i = 0; i < 7; i++) libs.Add(AddLibrary(user.Id, baseTime.AddMinutes(i)));
        var visibleEntry = new Entry { LibraryId = libs[0].Id };   // in an oldest (visible) library
        var hiddenEntry = new Entry { LibraryId = libs[6].Id };    // in a newest (hidden) library
        _db.Entries.AddRange(visibleEntry, hiddenEntry);
        await _db.SaveChangesAsync();

        var q = _premium.VisibleLibraries(user.Id, isPremium: false);

        var listed = await q.OrderByDescending(l => l.CreatedAt).Select(l => l.Id).ToListAsync();
        Assert.Equal(5, listed.Count);
        Assert.Equal(libs[4].Id, listed[0]); // newest *visible* first

        Assert.True(await q.AnyAsync(l => l.Id == libs[0].Id));
        Assert.False(await q.AnyAsync(l => l.Id == libs[6].Id));

        Assert.True(await q.AnyAsync(l => l.Entries.Any(e => e.Id == visibleEntry.Id)));
        Assert.False(await q.AnyAsync(l => l.Entries.Any(e => e.Id == hiddenEntry.Id)));
    }

    [Fact]
    public async Task HiddenLibraryCountAsync_CountsOverflowForFree_ZeroForPremium()
    {
        var user = AddUser("free");
        for (var i = 0; i < 7; i++) AddLibrary(user.Id, DateTime.UtcNow.AddMinutes(i));

        Assert.Equal(7 - PremiumService.FreeLibraryLimit, await _premium.HiddenLibraryCountAsync(user.Id, false));
        Assert.Equal(0, await _premium.HiddenLibraryCountAsync(user.Id, true));
    }

    // --- helpers ------------------------------------------------------------------------

    private ApplicationUser AddUser(string id, bool paid = false, DateTime? trialEnds = null)
    {
        var user = new ApplicationUser
        {
            Id = id,
            Email = $"{id}@t.com",
            UserName = id,
            IsPremium = paid,
            TrialStartedAt = trialEnds is null ? null : DateTime.UtcNow.AddDays(-1),
            TrialEndsAt = trialEnds,
        };
        _db.Users.Add(user);
        _db.SaveChanges();
        return user;
    }

    private Library AddLibrary(string userId, DateTime createdAt)
    {
        var lib = new Library { UserId = userId, Name = "L", CreatedAt = createdAt };
        _db.Libraries.Add(lib);
        _db.SaveChanges();
        return lib;
    }
}
