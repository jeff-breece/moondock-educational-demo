using System.Text.Json;
using CampWatch.Infrastructure.Models;
using NUnit.Framework;

namespace CampWatch.Tests;

/// <summary>
/// Verifies that CamplyWebhookPayload deserializes real camply JSON correctly.
/// Uses a fixture matching the schema from camply.utils.notifications.webhook.
/// </summary>
[TestFixture]
public class WebhookPayloadTests
{
    private const string CamplyFixtureJson = """
        {
            "campsites": [
                {
                    "campsite_id": "23735",
                    "booking_date": "2026-08-15T00:00:00",
                    "booking_end_date": "2026-08-17T00:00:00",
                    "booking_nights": 2,
                    "campsite_site_name": "Site 023",
                    "campsite_loop_name": "Loop A",
                    "campsite_type": "TENT_ONLY_NONELECTRIC",
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
                }
            ],
            "timestamp": "2026-07-02T20:00:00+00:00"
        }
        """;

    [Test]
    public void Deserialize_ValidFixture_ReturnsOneResult()
    {
        var payload = JsonSerializer.Deserialize<CamplyWebhookPayload>(CamplyFixtureJson);

        Assert.That(payload, Is.Not.Null);
        Assert.That(payload!.Campsites, Has.Count.EqualTo(1));
    }

    [Test]
    public void Deserialize_CampsiteId_IsCorrect()
    {
        var payload = JsonSerializer.Deserialize<CamplyWebhookPayload>(CamplyFixtureJson)!;
        Assert.That(payload.Campsites[0].CampsiteId, Is.EqualTo("23735"));
    }

    [Test]
    public void Deserialize_BookingDates_ArePopulated()
    {
        var payload = JsonSerializer.Deserialize<CamplyWebhookPayload>(CamplyFixtureJson)!;
        var site    = payload.Campsites[0];

        Assert.That(site.BookingDate.Date,    Is.EqualTo(new DateTime(2026, 8, 15)));
        Assert.That(site.BookingEndDate.Date, Is.EqualTo(new DateTime(2026, 8, 17)));
        Assert.That(site.BookingNights,       Is.EqualTo(2));
    }

    [Test]
    public void Deserialize_FacilityFields_AreCorrect()
    {
        var payload = JsonSerializer.Deserialize<CamplyWebhookPayload>(CamplyFixtureJson)!;
        var site    = payload.Campsites[0];

        Assert.That(site.FacilityName,     Is.EqualTo("Stewart Lake Campground"));
        Assert.That(site.FacilityId,       Is.EqualTo("554"));
        Assert.That(site.RecreationArea,   Is.EqualTo("Stewart Lake State Park"));
        Assert.That(site.RecreationAreaId, Is.EqualTo("554"));
    }

    [Test]
    public void Deserialize_AvailabilityStatus_IsAvailable()
    {
        var payload = JsonSerializer.Deserialize<CamplyWebhookPayload>(CamplyFixtureJson)!;
        Assert.That(payload.Campsites[0].AvailabilityStatus, Is.EqualTo("Available"));
    }

    [Test]
    public void Deserialize_BookingUrl_IsPresent()
    {
        var payload = JsonSerializer.Deserialize<CamplyWebhookPayload>(CamplyFixtureJson)!;
        Assert.That(payload.Campsites[0].BookingUrl, Does.StartWith("https://"));
    }

    [Test]
    public void Deserialize_Occupancy_IsTwoElementArray()
    {
        var payload = JsonSerializer.Deserialize<CamplyWebhookPayload>(CamplyFixtureJson)!;
        var occ     = payload.Campsites[0].CampsiteOccupancy;

        Assert.That(occ, Has.Length.EqualTo(2));
        Assert.That(occ[0], Is.EqualTo(1));
        Assert.That(occ[1], Is.EqualTo(8));
    }

    [Test]
    public void Deserialize_Timestamp_ParsesCorrectly()
    {
        var payload = JsonSerializer.Deserialize<CamplyWebhookPayload>(CamplyFixtureJson)!;
        Assert.That(payload.Timestamp.Year,  Is.EqualTo(2026));
        Assert.That(payload.Timestamp.Month, Is.EqualTo(7));
        Assert.That(payload.Timestamp.Day,   Is.EqualTo(2));
    }

    [Test]
    public void Deserialize_NullOptionalFields_DoNotThrow()
    {
        var payload = JsonSerializer.Deserialize<CamplyWebhookPayload>(CamplyFixtureJson)!;
        var site    = payload.Campsites[0];

        Assert.That(site.Location,           Is.Null);
        Assert.That(site.PermittedEquipment, Is.Null);
        Assert.That(site.CampsiteAttributes, Is.Null);
    }

    [Test]
    public void Deserialize_EmptyCampsitesList_ReturnsPayloadWithNoCampsites()
    {
        const string empty = """{ "campsites": [], "timestamp": "2026-07-02T20:00:00+00:00" }""";
        var payload = JsonSerializer.Deserialize<CamplyWebhookPayload>(empty)!;
        Assert.That(payload.Campsites, Is.Empty);
    }

    /// <summary>
    /// Regression for the empty-Results bug: real camply sends numeric IDs
    /// (campsite_id, facility_id, recreation_area_id as JSON numbers). Without
    /// IntOrStringJsonConverter on campsite_id the payload failed to bind (400)
    /// and matches were silently dropped. This fixture mirrors a live payload.
    /// </summary>
    private const string NumericIdFixtureJson = """
        {
            "campsites": [
                {
                    "campsite_id": 19174,
                    "booking_date": "2026-08-14T00:00:00",
                    "booking_end_date": "2026-08-16T00:00:00",
                    "booking_nights": 2,
                    "campsite_site_name": "Campsite Equestrian Non-Electric #005",
                    "campsite_loop_name": null,
                    "campsite_type": "Equestrian Camping",
                    "campsite_occupancy": [0, 1],
                    "campsite_use_type": "Campsite Equestrian Non-Electric",
                    "availability_status": "Available",
                    "recreation_area": "Great Seal State Park",
                    "recreation_area_id": 353,
                    "facility_name": "Great Seal Campground",
                    "facility_id": 447,
                    "booking_url": "https://www.OhioStateParks.com/OhioCampWeb#!park/353/447",
                    "location": { "latitude": 39.402487, "longitude": -82.940859 },
                    "permitted_equipment": null,
                    "campsite_attributes": null
                }
            ],
            "timestamp": "2026-07-03T17:00:00+00:00"
        }
        """;

    [Test]
    public void Deserialize_NumericCampsiteId_BindsToString()
    {
        var payload = JsonSerializer.Deserialize<CamplyWebhookPayload>(NumericIdFixtureJson);

        Assert.That(payload, Is.Not.Null);
        Assert.That(payload!.Campsites, Has.Count.EqualTo(1));

        var site = payload.Campsites[0];
        Assert.That(site.CampsiteId,       Is.EqualTo("19174"));
        Assert.That(site.FacilityId,       Is.EqualTo("447"));
        Assert.That(site.RecreationAreaId, Is.EqualTo("353"));
    }
}
