namespace CampWatch.Infrastructure.Models;

/// <summary>
/// Defines one camply search job: which campgrounds to watch, date window, and equipment.
/// CampgroundIds and Equipment are stored as JSON strings (EF value converter added in #187).
/// </summary>
public class SearchProfile
{
    public int Id { get; set; }
    public string Name { get; set; } = "";

    /// <summary>e.g., "recreation.gov", "ohio_state_parks"</summary>
    public string Provider { get; set; } = "";

    /// <summary>JSON array of campground/facility IDs. e.g., "[\"553\",\"554\"]"</summary>
    public string CampgroundIdsJson { get; set; } = "[]";

    public string StartDate { get; set; } = "";
    public string EndDate { get; set; } = "";
    public int Nights { get; set; } = 2;

    /// <summary>JSON array of equipment tokens. e.g., "[\"TENT\"]"</summary>
    public string EquipmentJson { get; set; } = "[]";

    public bool IsActive { get; set; } = true;
}
