using CampWatch.Infrastructure;
using CampWatch.Infrastructure.Models;
using Microsoft.EntityFrameworkCore;

namespace CampWatch.Api.Routes;

public static class OutingRoutes
{
    public static void MapOutingRoutes(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/outings");

        group.MapGet("/",   List)
             .WithName("ListOutings")
             .WithSummary("All outing log entries, newest first.");

        group.MapPost("/",  Create)
             .WithName("CreateOuting")
             .WithSummary("Manually record an outdoor trip.");
    }

    private static async Task<IResult> List(CampWatchDbContext db)
    {
        var outings = await db.Outings
            .OrderByDescending(o => o.Date)
            .ToListAsync();
        return Results.Ok(outings);
    }

    private static async Task<IResult> Create(OutingLog body, CampWatchDbContext db)
    {
        body.RecordedAt = DateTimeOffset.UtcNow;
        db.Outings.Add(body);
        await db.SaveChangesAsync();
        return Results.Created($"/api/outings/{body.Id}", body);
    }
}
