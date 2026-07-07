namespace CampWatch.Infrastructure.Models;

/// <summary>
/// User scoring weights for campsite evaluation. One active row drives CampsiteScorer.
/// Weights are additive integers (0–10 each); scorer sums and normalises to 0–100.
/// Implemented in full by issue #187.
/// </summary>
public class CampsitePreferences
{
    public int Id { get; set; }
    public string ProfileName { get; set; } = "default";
    public bool IsActive { get; set; } = true;

    // Terrain / vibe weights
    public int WoodedWeight { get; set; } = 5;
    public int RemoteWeight { get; set; } = 5;
    public int PrivateWeight { get; set; } = 5;

    // Proximity weights
    public int HikingWeight { get; set; } = 5;
    public int RiverWeight { get; set; } = 3;
    public int LakeWeight { get; set; } = 3;

    // Search window
    public int MinNights { get; set; } = 1;
    public int MaxNights { get; set; } = 7;
    public int SearchWindowDays { get; set; } = 90;

    /// <summary>Minimum score that triggers a Slack nudge (0–100).</summary>
    public int NudgeThresholdScore { get; set; } = 60;
}
