namespace CampWatch.Infrastructure.Models;

/// <summary>
/// Persisted record of a campsite availability signal received via the camply webhook.
/// Each AvailableCampsite in a WebhookBody produces one row.
/// </summary>
public class CampsiteSearchResult
{
    public int Id { get; set; }

    public string CampgroundName { get; set; } = "";
    public string Provider { get; set; } = "";
    public string SiteId { get; set; } = "";
    public string SiteType { get; set; } = "";
    public bool IsReservable { get; set; }

    public DateOnly CheckIn { get; set; }
    public DateOnly CheckOut { get; set; }

    public string BookingUrl { get; set; } = "";

    /// <summary>Score assigned by CampsiteScorer (0–100). Default 50 until #187.</summary>
    public int MatchScore { get; set; }

    public CampsiteStatus Status { get; set; } = CampsiteStatus.New;

    public DateTimeOffset ReceivedAt { get; set; }
}
