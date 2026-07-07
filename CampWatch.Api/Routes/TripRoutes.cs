using CampWatch.Infrastructure;
using CampWatch.Infrastructure.Models;
using Microsoft.EntityFrameworkCore;

namespace CampWatch.Api.Routes;

public static class TripRoutes
{
    public static void MapTripRoutes(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/trips");

        group.MapGet("/", ListTrips);
        group.MapPost("/", CreateTrip);
        group.MapPut("/{id:int}", UpdateTrip);
        group.MapDelete("/{id:int}", DeleteTrip);
    }

    private static async Task<IResult> ListTrips(CampWatchDbContext db)
    {
        var trips = await db.TripPlans.OrderByDescending(t => t.CreatedAt).ToListAsync();
        return Results.Ok(trips);
    }

    private static async Task<IResult> CreateTrip(TripPlan body, CampWatchDbContext db)
    {
        body.CreatedAt = DateTimeOffset.UtcNow;
        body.UpdatedAt = DateTimeOffset.UtcNow;
        if (string.IsNullOrEmpty(body.Status)) body.Status = "Planned";
        db.TripPlans.Add(body);
        await db.SaveChangesAsync();
        return Results.Created($"/api/trips/{body.Id}", body);
    }

    private static async Task<IResult> UpdateTrip(int id, TripPlan body, CampWatchDbContext db)
    {
        var existing = await db.TripPlans.FindAsync(id);
        if (existing is null) return Results.NotFound();

        existing.Name = body.Name;
        existing.Provider = body.Provider;
        existing.CampgroundId = body.CampgroundId;
        existing.CampgroundName = body.CampgroundName;
        existing.RecAreaId = body.RecAreaId;
        existing.RecAreaName = body.RecAreaName;
        existing.StartDate = body.StartDate;
        existing.EndDate = body.EndDate;
        existing.Nights = body.Nights;
        existing.Status = body.Status;
        existing.Notes = body.Notes;
        existing.ChecklistJson = body.ChecklistJson;
        existing.UpdatedAt = DateTimeOffset.UtcNow;

        await db.SaveChangesAsync();
        return Results.Ok(existing);
    }

    private static async Task<IResult> DeleteTrip(int id, CampWatchDbContext db)
    {
        var existing = await db.TripPlans.FindAsync(id);
        if (existing is null) return Results.NotFound();

        db.TripPlans.Remove(existing);
        await db.SaveChangesAsync();
        return Results.NoContent();
    }
}
