using CampWatch.Infrastructure;
using CampWatch.Infrastructure.Models;
using Microsoft.EntityFrameworkCore;

namespace CampWatch.Api.Routes;

public static class CampsiteRoutes
{
    public static void MapCampsiteRoutes(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/campsites");

        group.MapGet("/",           List)
             .WithName("ListCampsites")
             .WithSummary("Paginated campsite results with optional filters.");

        group.MapGet("/{id:int}",   GetOne)
             .WithName("GetCampsite")
             .WithSummary("Single campsite result by ID.");

        group.MapPatch("/{id:int}/status", PatchStatus)
             .WithName("PatchCampsiteStatus")
             .WithSummary("Update lifecycle status; Booked → creates OutingLog entry.");
    }

    private static async Task<IResult> List(
        CampWatchDbContext db,
        string?         provider  = null,
        string?         status    = null,
        int             minScore  = 0,
        DateTimeOffset? since     = null,
        int             page      = 1,
        int             pageSize  = 20)
    {
        var query = db.CampsiteResults.AsQueryable();

        if (!string.IsNullOrEmpty(provider))
            query = query.Where(r => r.Provider == provider);

        if (!string.IsNullOrEmpty(status) &&
            Enum.TryParse<CampsiteStatus>(status, ignoreCase: true, out var statusEnum))
            query = query.Where(r => r.Status == statusEnum);

        if (minScore > 0)
            query = query.Where(r => r.MatchScore >= minScore);

        // Scope results to a single search run so stale rows from earlier jobs
        // (same provider) are excluded. The UI passes the search start time. #200
        if (since is { } sinceValue)
            query = query.Where(r => r.ReceivedAt >= sinceValue);

        var total = await query.CountAsync();
        var items = await query
            .OrderByDescending(r => r.MatchScore)
            .ThenByDescending(r => r.ReceivedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return Results.Ok(new { total, page, pageSize, items });
    }

    private static async Task<IResult> GetOne(int id, CampWatchDbContext db)
    {
        var result = await db.CampsiteResults.FindAsync(id);
        return result is null ? Results.NotFound() : Results.Ok(result);
    }

    private static async Task<IResult> PatchStatus(
        int id,
        StatusPatchRequest body,
        CampWatchDbContext db,
        ILogger<CampWatchDbContext> logger)
    {
        var result = await db.CampsiteResults.FindAsync(id);
        if (result is null) return Results.NotFound();

        var previous = result.Status;
        result.Status = body.Status;

        // When a site is booked, auto-create an OutingLog entry
        if (body.Status == CampsiteStatus.Booked && previous != CampsiteStatus.Booked)
        {
            db.Outings.Add(new OutingLog
            {
                Location    = result.CampgroundName,
                Date        = result.CheckIn,
                DurationDays = result.CheckOut.DayNumber - result.CheckIn.DayNumber,
                Notes       = $"Booked via CampWatch — site {result.SiteId} at {result.BookingUrl}",
                RecordedAt  = DateTimeOffset.UtcNow,
            });
            logger.LogInformation(
                "Outing log created for booked site {SiteId} at {CampgroundName}",
                result.SiteId, result.CampgroundName);
        }

        await db.SaveChangesAsync();
        return Results.Ok(result);
    }
}

public record StatusPatchRequest(CampsiteStatus Status);
