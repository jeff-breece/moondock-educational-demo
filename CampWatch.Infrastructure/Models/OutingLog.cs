namespace CampWatch.Infrastructure.Models;

/// <summary>
/// A recorded outdoor trip. Feeds the RAG embedding corpus (issue #191)
/// so the nudge scheduler can personalise suggestions from past outing history.
/// </summary>
public class OutingLog
{
    public int Id { get; set; }

    public DateOnly Date { get; set; }
    public string Location { get; set; } = "";
    public string? Notes { get; set; }
    public int DurationDays { get; set; } = 1;

    public DateTimeOffset RecordedAt { get; set; }
}
