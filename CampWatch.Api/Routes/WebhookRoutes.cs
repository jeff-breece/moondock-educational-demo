using CampWatch.Api.Hubs;
using CampWatch.Api.Services;
using CampWatch.Infrastructure;
using CampWatch.Infrastructure.Models;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace CampWatch.Api.Routes;

public static class WebhookRoutes
{
    public static void MapWebhookRoutes(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/webhook");

        group.MapPost("/camply", HandleCamplyWebhook)
             .WithName("CamplyWebhook")
             .WithSummary("Receives camply availability notifications and persists them.");
    }

    private static async Task<IResult> HandleCamplyWebhook(
        CamplyWebhookPayload payload,
        HttpContext context,
        CampWatchDbContext db,
        CampsiteScorer scorer,
        IHubContext<CampWatchHub> hub,
        ILogger<CampWatchDbContext> logger)
    {
        // No signature header enforcement in MVP — log if present, continue regardless.
        // Full HMAC validation added when camply supports webhook secrets (future).

        // Provider is passed as a query param by the bridge: ?provider=OhioStateParks
        var provider = context.Request.Query["provider"].FirstOrDefault() ?? "camply";

        if (payload.Campsites is not { Count: > 0 })
        {
            logger.LogWarning("Received empty camply webhook payload at {Ts}", payload.Timestamp);
            return Results.Accepted();
        }

        logger.LogInformation(
            "Camply webhook received: {Count} site(s) at {Ts} (provider={Provider})",
            payload.Campsites.Count, payload.Timestamp, provider);

        // Load active preference profile for scoring; fall back to neutral if none found
        var prefs = await db.Preferences.FirstOrDefaultAsync(p => p.IsActive)
                    ?? new CampsitePreferences();

        var results = payload.Campsites.Select(site => new CampsiteSearchResult
        {
            CampgroundName = site.FacilityName,
            Provider       = provider,
            SiteId         = site.CampsiteId,
            SiteType       = site.CampsiteType ?? "",
            IsReservable   = true,
            CheckIn        = DateOnly.FromDateTime(site.BookingDate.LocalDateTime),
            CheckOut       = DateOnly.FromDateTime(site.BookingEndDate.LocalDateTime),
            BookingUrl     = site.BookingUrl,
            MatchScore     = scorer.Score(site, prefs),
            Status         = CampsiteStatus.New,
            ReceivedAt     = DateTimeOffset.UtcNow
        }).ToList();

        db.CampsiteResults.AddRange(results);
        await db.SaveChangesAsync();

        // Broadcast high-score results to connected SignalR clients
        var threshold = prefs.NudgeThresholdScore;
        foreach (var result in results.Where(r => r.MatchScore >= threshold))
        {
            await CampWatchHubEvents.BroadcastNewAlert(hub, result);
            logger.LogInformation(
                "Broadcast NewCampsiteAlert: site {SiteId} score {Score}",
                result.SiteId, result.MatchScore);
        }

        logger.LogInformation("Persisted {Count} result(s) from camply webhook.", results.Count);
        return Results.Accepted();
    }
}
