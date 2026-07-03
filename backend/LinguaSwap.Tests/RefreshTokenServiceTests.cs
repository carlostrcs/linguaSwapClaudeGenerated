using LinguaSwap.Api.Data;
using LinguaSwap.Api.Models;
using LinguaSwap.Api.Services;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Xunit;

namespace LinguaSwap.Tests;

/// <summary>
/// Exercises the refresh-token lifecycle against a real (in-memory SQLite) AppDbContext so the
/// unique-hash index and cascade mapping are in force, just like production.
/// </summary>
public class RefreshTokenServiceTests : IDisposable
{
    private readonly SqliteConnection _connection;
    private readonly AppDbContext _db;
    private readonly RefreshTokenService _service;
    private readonly ApplicationUser _user;

    public RefreshTokenServiceTests()
    {
        // A kept-open :memory: connection gives each test its own throwaway relational database.
        _connection = new SqliteConnection("DataSource=:memory:");
        _connection.Open();

        _db = new AppDbContext(new DbContextOptionsBuilder<AppDbContext>()
            .UseSqlite(_connection)
            .Options);
        _db.Database.EnsureCreated();

        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?> { ["Jwt:RefreshTokenDays"] = "30" })
            .Build();
        _service = new RefreshTokenService(_db, config);

        _user = new ApplicationUser { Id = "user-1", Email = "a@b.com", UserName = "a@b.com" };
        _db.Users.Add(_user);
        _db.SaveChanges();
    }

    public void Dispose()
    {
        _db.Dispose();
        _connection.Dispose();
    }

    [Fact]
    public async Task Issue_PersistsHashedToken_NotTheRawValue()
    {
        var raw = await _service.IssueAsync(_user.Id);

        Assert.False(string.IsNullOrWhiteSpace(raw));
        var stored = await _db.RefreshTokens.SingleAsync();
        Assert.NotEqual(raw, stored.TokenHash); // hash is stored, never the raw token
        Assert.Equal(_user.Id, stored.UserId);
        Assert.True(stored.IsActive);
    }

    [Fact]
    public async Task ValidateAndRotate_RevokesOld_AndReturnsNewActiveToken()
    {
        var raw = await _service.IssueAsync(_user.Id);

        var rotated = await _service.ValidateAndRotateAsync(raw);

        Assert.NotNull(rotated);
        Assert.Equal(_user.Id, rotated!.Value.User.Id);
        Assert.NotEqual(raw, rotated.Value.NewRawToken);

        var tokens = await _db.RefreshTokens.ToListAsync();
        Assert.Equal(2, tokens.Count);
        Assert.Single(tokens.Where(t => t.IsActive)); // exactly the rotated-in token is usable
    }

    [Fact]
    public async Task ValidateAndRotate_RejectsTheOldTokenAfterRotation()
    {
        var raw = await _service.IssueAsync(_user.Id);
        await _service.ValidateAndRotateAsync(raw); // original is now revoked

        Assert.Null(await _service.ValidateAndRotateAsync(raw));
    }

    [Fact]
    public async Task ValidateAndRotate_RejectsUnknownToken()
    {
        Assert.Null(await _service.ValidateAndRotateAsync("not-a-real-token"));
    }

    [Fact]
    public async Task ValidateAndRotate_RejectsExpiredToken()
    {
        var raw = await _service.IssueAsync(_user.Id);
        var stored = await _db.RefreshTokens.SingleAsync();
        stored.ExpiresAt = DateTime.UtcNow.AddSeconds(-1); // age it past expiry
        await _db.SaveChangesAsync();

        Assert.Null(await _service.ValidateAndRotateAsync(raw));
    }

    [Fact]
    public async Task Revoke_MakesTokenUnusable()
    {
        var raw = await _service.IssueAsync(_user.Id);

        await _service.RevokeAsync(raw);

        Assert.Null(await _service.ValidateAndRotateAsync(raw));
    }

    [Fact]
    public async Task Issue_PrunesThisUsersSpentTokens()
    {
        // A revoked leftover from a previous session should be cleaned up on the next issue.
        var first = await _service.IssueAsync(_user.Id);
        await _service.RevokeAsync(first);

        await _service.IssueAsync(_user.Id);

        var tokens = await _db.RefreshTokens.ToListAsync();
        Assert.Single(tokens); // the revoked one was pruned, only the fresh token remains
        Assert.True(tokens[0].IsActive);
    }
}
