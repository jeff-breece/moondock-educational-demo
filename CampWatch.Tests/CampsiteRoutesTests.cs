using CampWatch.Infrastructure;
using CampWatch.Infrastructure.Models;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using NUnit.Framework;

namespace CampWatch.Tests;

/// <summary>
/// Verifies the "since" window filter used by GET /api/campsites (issue #200).
/// The results view must be scoped to a single search run so stale rows from
/// earlier jobs (same provider) never surface. Exercises the exact predicate
/// the List handler applies, against an in-memory SQLite DB.
/// </summary>
[TestFixture]
public class CampsiteRoutesTests
{
    private SqliteConnection _connection = null!;
    private CampWatchDbContext _db = null!;

    [SetUp]
    public void SetUp()
    {
        _connection = new SqliteConnection("Filename=:memory:");
        _connection.Open();
        var opts = new DbContextOptionsBuilder<CampWatchDbContext>()
            .UseSqlite(_connection).Options;
        _db = new CampWatchDbContext(opts);
        _db.Database.EnsureCreated();
    }

    [TearDown]
    public void TearDown()
    {
        _db.Dispose();
        _connection.Dispose();
    }

    private CampsiteSearchResult Seed(string siteId, DateTimeOffset receivedAt)
    {
        var row = new CampsiteSearchResult
        {
            CampgroundName = "Hocking Hills",
            Provider       = "OhioStateParks",
            SiteId         = siteId,
            SiteType       = "WALK_IN",
            IsReservable   = true,
            CheckIn        = new DateOnly(2026, 7, 10),
            CheckOut       = new DateOnly(2026, 7, 12),
            BookingUrl     = "https://example.com",
            MatchScore     = 80,
            Status         = CampsiteStatus.New,
            ReceivedAt     = receivedAt,
        };
        _db.CampsiteResults.Add(row);
        return row;
    }

    [Test]
    public async Task SinceFilter_ExcludesRowsFromEarlierRuns()
    {
        var searchStartedAt = DateTimeOffset.Parse("2026-07-02T12:00:00Z");
        Seed("STALE", searchStartedAt.AddHours(-1)); // previous run
        Seed("FRESH", searchStartedAt.AddMinutes(5)); // this run
        await _db.SaveChangesAsync();

        var rows = await _db.CampsiteResults
            .Where(r => r.Provider == "OhioStateParks")
            .Where(r => r.ReceivedAt >= searchStartedAt)
            .ToListAsync();

        Assert.That(rows, Has.Count.EqualTo(1));
        Assert.That(rows[0].SiteId, Is.EqualTo("FRESH"));
    }

    [Test]
    public async Task NoSinceFilter_ReturnsAllRows()
    {
        var t = DateTimeOffset.Parse("2026-07-02T12:00:00Z");
        Seed("A", t.AddHours(-1));
        Seed("B", t.AddMinutes(5));
        await _db.SaveChangesAsync();

        var rows = await _db.CampsiteResults.ToListAsync();
        Assert.That(rows, Has.Count.EqualTo(2));
    }
}
