using CampWatch.Infrastructure.Models;
using Microsoft.AspNetCore.SignalR;

namespace CampWatch.Api.Hubs;

/// <summary>
/// Real-time SignalR hub for CampWatch v2.
/// Connected on: /hubs/campwatch
///
/// Server → client events:
///   NewCampsiteAlert(CampsiteSearchResult)   — score ≥ threshold, fired by webhook receiver
///   JobStatusChanged({ jobId, status, campgroundName }) — fired by bridge job monitor
///   NudgeTriggered({ days_since_outing, top_pick }) — fired by NudgeScheduler (#192)
///
/// Client → server (optional group subscription):
///   SubscribeToProfile(profileName) — join broadcast group for a named search profile
/// </summary>
public class CampWatchHub : Hub
{
    /// <summary>
    /// Client can call this to receive profile-scoped broadcasts in addition to All.
    /// Group name: "profile:{profileName}"
    /// </summary>
    public async Task SubscribeToProfile(string profileName)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, $"profile:{profileName}");
    }

    /// <summary>Client can unsubscribe from a profile group.</summary>
    public async Task UnsubscribeFromProfile(string profileName)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"profile:{profileName}");
    }
}

/// <summary>
/// Helper wrappers so callers don't hardcode string event names.
/// </summary>
public static class CampWatchHubEvents
{
    public const string NewCampsiteAlert  = "NewCampsiteAlert";
    public const string JobStatusChanged  = "JobStatusChanged";
    public const string NudgeTriggered    = "NudgeTriggered";

    public static Task BroadcastNewAlert(
        IHubContext<CampWatchHub> hub,
        CampsiteSearchResult result,
        CancellationToken ct = default) =>
        hub.Clients.All.SendAsync(NewCampsiteAlert, result, ct);

    public static Task BroadcastJobStatus(
        IHubContext<CampWatchHub> hub,
        string jobId,
        string status,
        string campgroundName,
        CancellationToken ct = default) =>
        hub.Clients.All.SendAsync(JobStatusChanged, new { jobId, status, campgroundName }, ct);

    public static Task BroadcastNudge(
        IHubContext<CampWatchHub> hub,
        int daysSinceOuting,
        object topPick,
        CancellationToken ct = default) =>
        hub.Clients.All.SendAsync(NudgeTriggered, new { days_since_outing = daysSinceOuting, top_pick = topPick }, ct);
}
