namespace CampWatch.Infrastructure.Models;

/// <summary>Lifecycle state of a discovered campsite result.</summary>
public enum CampsiteStatus
{
    New = 0,
    Interested = 1,
    Booked = 2,
    Dismissed = 3
}
