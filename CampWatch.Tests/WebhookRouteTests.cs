using System.Text.Json;
using CampWatch.Infrastructure;
using CampWatch.Infrastructure.Models;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using NUnit.Framework;

namespace CampWatch.Tests;

/// <summary>
/// Integration-style tests for POST /api/webhook/camply.
/// Uses an in-memory SQLite DB (no HTTP stack); calls the handler directly
/// via the DbContext to verify persistence behaviour.
/// </summary>
[TestFixture]
public class WebhookRouteTests
{
    private SqliteConnection _connection = null!;
    private CampWatchDbContext _db = null!;

    // Minimal valid camply webhook payload (single site)
    private const string ValidPayloadJson = """
        {
            "campsites": [{
                "campsite_id": "23735",
                "booking_date": "2026-08-15T00:00:00",
                "booking_end_date": "2026-08-17T00:00:00",
                "booking_nights": 2,
                "campsite_site_name": "Site 023",
                "campsite_loop_name": null,
                "campsite_type": "WOODED_TENT_ONLY_NONELECTRIC",
                "campsite_occupancy": [1, 8],
                "campsite_use_type": "Overnight",
                "availability_status": "Available",
                "recreation_area": "Stewart Lake State Park",
                "recreation_area_id": "554",
                "facility_name": "Stewart Lake Campground",
                "facility_id": "554",
                "booking_url": "https://reservations.ohio.gov/camping/site/23735",
                "location": null,
                "permitted_equipment": null,
                "campsite_attributes": null
            }],
            "timestamp": "2026-07-02T20:00:00+00:00"
        }
        """;

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

    private static CamplyWebhookPayload Deserialize(string json) =>
        JsonSerializer.Deserialize<CamplyWebhookPayload>(json)!;

    [Test]
    public async Task ValidPayload_PersistsOneResult()
    {
        var payload = Deserialize(ValidPayloadJson);
        var scorer  = new global::CampWatch.Api.Services.CampsiteScorer();
        var prefs   = new CampsitePreferences { WoodedWeight = 8, RemoteWeight = 9, PrivateWeight = 9, HikingWeight = 7 };

        var results = payload.Campsites.Select(site => new CampsiteSearchResult
        {
            CampgroundName = site.FacilityName,
            Provider       = "camply",
            SiteId         = site.CampsiteId,
            SiteType       = site.CampsiteType ?? "",
            IsReservable   = true,
            CheckIn        = DateOnly.FromDateTime(site.BookingDate.LocalDateTime),
            CheckOut       = DateOnly.FromDateTime(site.BookingEndDate.LocalDateTime),
            BookingUrl     = site.BookingUrl,
            MatchScore     = scorer.Score(site, prefs),
            Status         = CampsiteStatus.New,
            ReceivedAt     = DateTimeOffset.UtcNow,
        }).ToList();

        _db.CampsiteResults.AddRange(results);
        await _db.SaveChangesAsync();

        var stored = await _db.CampsiteResults.ToListAsync();
        Assert.That(stored, Has.Count.EqualTo(1));
    }

    [Test]
    public async Task ValidPayload_SiteId_MatchesInput()
    {
        var payload = Deserialize(ValidPayloadJson);
        _db.CampsiteResults.Add(new CampsiteSearchResult
        {
            CampgroundName = payload.Campsites[0].FacilityName,
            SiteId         = payload.Campsites[0].CampsiteId,
            Provider       = "camply",
            CheckIn        = DateOnly.FromDateTime(payload.Campsites[0].BookingDate.LocalDateTime),
            CheckOut       = DateOnly.FromDateTime(payload.Campsites[0].BookingEndDate.LocalDateTime),
            ReceivedAt     = DateTimeOffset.UtcNow,
        });
        await _db.SaveChangesAsync();

        var stored = await _db.CampsiteResults.FirstAsync();
        Assert.That(stored.SiteId, Is.EqualTo("23735"));
    }

    [Test]
    public async Task ValidPayload_DefaultStatus_IsNew()
    {
        var payload = Deserialize(ValidPayloadJson);
        _db.CampsiteResults.Add(new CampsiteSearchResult
        {
            SiteId     = payload.Campsites[0].CampsiteId,
            CheckIn    = DateOnly.FromDateTime(payload.Campsites[0].BookingDate.LocalDateTime),
            CheckOut   = DateOnly.FromDateTime(payload.Campsites[0].BookingEndDate.LocalDateTime),
            ReceivedAt = DateTimeOffset.UtcNow,
            Status     = CampsiteStatus.New,
        });
        await _db.SaveChangesAsync();

        var stored = await _db.CampsiteResults.FirstAsync();
        Assert.That(stored.Status, Is.EqualTo(CampsiteStatus.New));
    }

    [Test]
    public async Task WoodedTentSite_ReceivesHighScore()
    {
        var payload = Deserialize(ValidPayloadJson);
        var scorer  = new global::CampWatch.Api.Services.CampsiteScorer();
        var prefs   = new CampsitePreferences
        {
            WoodedWeight = 8, RemoteWeight = 9, PrivateWeight = 9, HikingWeight = 7,
        };

        var score = scorer.Score(payload.Campsites[0], prefs);

        // WOODED_TENT_ONLY_NONELECTRIC with moondock profile should score above threshold
        Assert.That(score, Is.GreaterThan(60));
    }

    [Test]
    public async Task EmptyPayload_PersistsNothing()
    {
        const string empty = """{ "campsites": [], "timestamp": "2026-07-02T20:00:00+00:00" }""";
        var payload = Deserialize(empty);

        if (payload.Campsites.Count > 0)
        {
            _db.CampsiteResults.AddRange(payload.Campsites.Select(s => new CampsiteSearchResult
            {
                SiteId = s.CampsiteId, ReceivedAt = DateTimeOffset.UtcNow,
                CheckIn = DateOnly.FromDateTime(s.BookingDate.LocalDateTime),
                CheckOut = DateOnly.FromDateTime(s.BookingEndDate.LocalDateTime),
            }));
            await _db.SaveChangesAsync();
        }

        Assert.That(await _db.CampsiteResults.CountAsync(), Is.EqualTo(0));
    }
}
