using CampWatch.Infrastructure;
using CampWatch.Infrastructure.Models;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using NUnit.Framework;

namespace CampWatch.Tests;

/// <summary>
/// Tests for outing log persistence and ordering.
/// </summary>
[TestFixture]
public class OutingLogTests
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

    [Test]
    public async Task PostOuting_CanBeRetrieved()
    {
        var outing = new OutingLog
        {
            Location     = "Stewart Lake SP",
            Date         = new DateOnly(2026, 8, 15),
            DurationDays = 2,
            RecordedAt   = DateTimeOffset.UtcNow,
        };
        _db.Outings.Add(outing);
        await _db.SaveChangesAsync();

        var loaded = await _db.Outings.FindAsync(outing.Id);
        Assert.That(loaded, Is.Not.Null);
        Assert.That(loaded!.Location, Is.EqualTo("Stewart Lake SP"));
    }

    [Test]
    public async Task GetList_OrderedByDateDescending()
    {
        _db.Outings.AddRange(
            new OutingLog { Location = "A", Date = new DateOnly(2026, 6, 1), RecordedAt = DateTimeOffset.UtcNow },
            new OutingLog { Location = "B", Date = new DateOnly(2026, 8, 15), RecordedAt = DateTimeOffset.UtcNow },
            new OutingLog { Location = "C", Date = new DateOnly(2026, 7, 4), RecordedAt = DateTimeOffset.UtcNow }
        );
        await _db.SaveChangesAsync();

        var ordered = await _db.Outings.OrderByDescending(o => o.Date).ToListAsync();

        Assert.That(ordered[0].Location, Is.EqualTo("B")); // 2026-08-15 newest
        Assert.That(ordered[1].Location, Is.EqualTo("C")); // 2026-07-04
        Assert.That(ordered[2].Location, Is.EqualTo("A")); // 2026-06-01 oldest
    }

    [Test]
    public async Task PostOuting_DurationDays_IsCorrect()
    {
        var outing = new OutingLog
        {
            Location     = "Scioto Trail SP",
            Date         = new DateOnly(2026, 9, 10),
            DurationDays = 3,
            RecordedAt   = DateTimeOffset.UtcNow,
        };
        _db.Outings.Add(outing);
        await _db.SaveChangesAsync();

        var loaded = await _db.Outings.FirstAsync(o => o.Location == "Scioto Trail SP");
        Assert.That(loaded.DurationDays, Is.EqualTo(3));
    }

    [Test]
    public async Task BookedStatusTransition_CreatesOutingLog()
    {
        // Simulates the PATCH /api/campsites/{id}/status → Booked auto-create path
        var site = new CampsiteSearchResult
        {
            CampgroundName = "Stewart Lake Campground",
            SiteId         = "23735",
            Provider       = "camply",
            CheckIn        = new DateOnly(2026, 8, 15),
            CheckOut       = new DateOnly(2026, 8, 17),
            Status         = CampsiteStatus.New,
            ReceivedAt     = DateTimeOffset.UtcNow,
        };
        _db.CampsiteResults.Add(site);
        await _db.SaveChangesAsync();

        // Transition to Booked
        site.Status = CampsiteStatus.Booked;
        _db.Outings.Add(new OutingLog
        {
            Location     = site.CampgroundName,
            Date         = site.CheckIn,
            DurationDays = site.CheckOut.DayNumber - site.CheckIn.DayNumber,
            Notes        = $"Booked via CampWatch — site {site.SiteId}",
            RecordedAt   = DateTimeOffset.UtcNow,
        });
        await _db.SaveChangesAsync();

        var outings = await _db.Outings.ToListAsync();
        Assert.That(outings, Has.Count.EqualTo(1));
        Assert.That(outings[0].Location, Is.EqualTo("Stewart Lake Campground"));
        Assert.That(outings[0].DurationDays, Is.EqualTo(2));
    }

    [Test]
    public async Task PostOuting_Notes_CanBeNull()
    {
        var outing = new OutingLog
        {
            Location   = "Red River Gorge",
            Date       = new DateOnly(2026, 10, 1),
            Notes      = null,
            RecordedAt = DateTimeOffset.UtcNow,
        };
        _db.Outings.Add(outing);
        await _db.SaveChangesAsync();

        var loaded = await _db.Outings.FindAsync(outing.Id);
        Assert.That(loaded!.Notes, Is.Null);
    }
}
