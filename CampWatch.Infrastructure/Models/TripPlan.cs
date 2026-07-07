namespace CampWatch.Infrastructure.Models;

public class TripPlan
{
    public int Id { get; set; }
    public string Name { get; set; } = "";
    public string Provider { get; set; } = "";
    public string CampgroundId { get; set; } = "";
    public string CampgroundName { get; set; } = "";
    public string RecAreaId { get; set; } = "";
    public string RecAreaName { get; set; } = "";
    public string StartDate { get; set; } = "";
    public string EndDate { get; set; } = "";
    public int Nights { get; set; } = 2;
    public string Status { get; set; } = "Planned";
    public string? Notes { get; set; }
    public string ChecklistJson { get; set; } = "[]";
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
}
