using CampWatch.Infrastructure;
using CampWatch.Infrastructure.Models;
using Microsoft.EntityFrameworkCore;

namespace CampWatch.Api.Routes;

public static class PreferenceRoutes
{
    public static void MapPreferenceRoutes(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/preferences");

        group.MapGet("/",           GetAll);
        group.MapPost("/",          Create);
        group.MapPut("/{id:int}",   Update);
    }

    private static async Task<IResult> GetAll(CampWatchDbContext db)
    {
        var prefs = await db.Preferences.OrderBy(p => p.ProfileName).ToListAsync();
        return Results.Ok(prefs);
    }

    private static async Task<IResult> Create(
        CampsitePreferences body,
        CampWatchDbContext db)
    {
        db.Preferences.Add(body);
        await db.SaveChangesAsync();
        return Results.Created($"/api/preferences/{body.Id}", body);
    }

    private static async Task<IResult> Update(
        int id,
        CampsitePreferences body,
        CampWatchDbContext db)
    {
        var existing = await db.Preferences.FindAsync(id);
        if (existing is null) return Results.NotFound();

        existing.ProfileName       = body.ProfileName;
        existing.IsActive          = body.IsActive;
        existing.WoodedWeight      = body.WoodedWeight;
        existing.RemoteWeight      = body.RemoteWeight;
        existing.PrivateWeight     = body.PrivateWeight;
        existing.HikingWeight      = body.HikingWeight;
        existing.RiverWeight       = body.RiverWeight;
        existing.LakeWeight        = body.LakeWeight;
        existing.MinNights         = body.MinNights;
        existing.MaxNights         = body.MaxNights;
        existing.SearchWindowDays  = body.SearchWindowDays;
        existing.NudgeThresholdScore = body.NudgeThresholdScore;

        await db.SaveChangesAsync();
        return Results.Ok(existing);
    }
}
