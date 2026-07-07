using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using CampWatch.Infrastructure;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.SignalR.Client;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using NUnit.Framework;

namespace CampWatch.Tests;

/// <summary>
/// Full in-process SignalR integration test.
/// Starts the API via WebApplicationFactory, connects a SignalR client,
/// posts a high-score webhook payload, and asserts NewCampsiteAlert arrives within 2s.
/// Tagged [Category("Integration")] — excluded from unit-only runs if needed.
/// </summary>
[TestFixture]
[Category("Integration")]
public class CampWatchHubIntegrationTests : IDisposable
{
    private SqliteConnection _connection = null!;
    private WebApplicationFactory<Program> _factory = null!;

    // High-score campsite: WOODED + PRIMITIVE → scorer gives ≥80 with moondock weights
    private const string HighScorePayloadJson = """
        {
            "campsites": [{
                "campsite_id": "99001",
                "booking_date": "2026-09-05T00:00:00",
                "booking_end_date": "2026-09-07T00:00:00",
                "booking_nights": 2,
                "campsite_site_name": "Site 001",
                "campsite_loop_name": null,
                "campsite_type": "WOODED_NONELECTRIC_PRIMITIVE",
                "campsite_occupancy": [1, 6],
                "campsite_use_type": "Overnight",
                "availability_status": "Available",
                "recreation_area": "Scioto Trail State Park",
                "recreation_area_id": "553",
                "facility_name": "Scioto Trail Campground",
                "facility_id": "553",
                "booking_url": "https://reservations.ohio.gov/camping/site/99001",
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

        _factory = new WebApplicationFactory<Program>()
            .WithWebHostBuilder(builder =>
            {
                builder.ConfigureServices(services =>
                {
                    // Replace the RAID-path SQLite registration with an in-memory connection
                    var toRemove = services
                        .Where(d => d.ServiceType == typeof(DbContextOptions<CampWatchDbContext>)
                                 || d.ServiceType == typeof(CampWatchDbContext))
                        .ToList();
                    foreach (var d in toRemove) services.Remove(d);

                    services.AddDbContext<CampWatchDbContext>(opts =>
                        opts.UseSqlite(_connection));
                });
            });
    }

    [TearDown]
    public void TearDown() => Dispose();

    public void Dispose()
    {
        _factory?.Dispose();
        _connection?.Dispose();
    }

    [Test]
    public async Task PostWebhook_HighScoreSite_BroadcastsNewCampsiteAlert()
    {
        var alertReceived = new TaskCompletionSource<JsonElement>(
            TaskCreationOptions.RunContinuationsAsynchronously);

        // Build SignalR client pointing at the in-process test server
        var connection = new HubConnectionBuilder()
            .WithUrl("http://localhost/hubs/campwatch", opts =>
            {
                opts.HttpMessageHandlerFactory = _ => _factory.Server.CreateHandler();
            })
            .Build();

        connection.On<JsonElement>(
            "NewCampsiteAlert",
            result => alertReceived.TrySetResult(result));

        await connection.StartAsync();

        // POST the high-score webhook payload
        var client   = _factory.CreateClient();
        var content  = new StringContent(HighScorePayloadJson, Encoding.UTF8, "application/json");
        var response = await client.PostAsync("/api/webhook/camply", content);

        Assert.That((int)response.StatusCode, Is.EqualTo(202),
            "Webhook endpoint must return 202 Accepted");

        // Wait up to 2 seconds for the SignalR event
        using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(2));
        cts.Token.Register(() => alertReceived.TrySetCanceled());

        JsonElement alert;
        Assert.DoesNotThrowAsync(
            async () => alert = await alertReceived.Task,
            "NewCampsiteAlert should arrive within 2 seconds");

        await connection.StopAsync();
    }

    [Test]
    public async Task PostWebhook_LowScoreSite_DoesNotBroadcastAlert()
    {
        // RV FULL_HOOKUP site → score ≈ 0; should NOT trigger broadcast
        const string lowScoreJson = """
            {
                "campsites": [{
                    "campsite_id": "99002",
                    "booking_date": "2026-09-05T00:00:00",
                    "booking_end_date": "2026-09-07T00:00:00",
                    "booking_nights": 2,
                    "campsite_site_name": "Site 002",
                    "campsite_loop_name": null,
                    "campsite_type": "FULL_HOOKUP",
                    "campsite_occupancy": [1, 8],
                    "campsite_use_type": "Overnight",
                    "availability_status": "Available",
                    "recreation_area": "Test Area",
                    "recreation_area_id": "1",
                    "facility_name": "Test Campground",
                    "facility_id": "1",
                    "booking_url": "https://example.com",
                    "location": null,
                    "permitted_equipment": null,
                    "campsite_attributes": null
                }],
                "timestamp": "2026-07-02T20:00:00+00:00"
            }
            """;

        var alertReceived = new TaskCompletionSource<JsonElement>(
            TaskCreationOptions.RunContinuationsAsynchronously);

        var connection = new HubConnectionBuilder()
            .WithUrl("http://localhost/hubs/campwatch", opts =>
            {
                opts.HttpMessageHandlerFactory = _ => _factory.Server.CreateHandler();
            })
            .Build();

        connection.On<JsonElement>("NewCampsiteAlert",
            result => alertReceived.TrySetResult(result));

        await connection.StartAsync();

        var client   = _factory.CreateClient();
        var content  = new StringContent(lowScoreJson, Encoding.UTF8, "application/json");
        var response = await client.PostAsync("/api/webhook/camply", content);

        Assert.That((int)response.StatusCode, Is.EqualTo(202));

        // Alert must NOT arrive for a low-score RV site
        using var cts = new CancellationTokenSource(TimeSpan.FromMilliseconds(800));
        cts.Token.Register(() => alertReceived.TrySetCanceled());

        Assert.ThrowsAsync<TaskCanceledException>(
            async () => await alertReceived.Task,
            "NewCampsiteAlert must NOT be broadcast for low-score RV sites");

        await connection.StopAsync();
    }
}
