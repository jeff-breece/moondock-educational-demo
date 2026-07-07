using CampWatch.Api.Services;

namespace CampWatch.Api.Routes;

/// <summary>
/// Routes that proxy camply-bridge operations.
/// All methods delegate to ICamplyBridgeClient; errors from the bridge
/// are surfaced as 502 Bad Gateway with the original message.
/// </summary>
public static class CamplyRoutes
{
    public static void MapCamplyRoutes(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/camply");

        group.MapPost("/request",           OneShot)
             .WithName("CamplyOneShot")
             .WithSummary("One-shot camply invocation (non-daemon).");

        group.MapGet("/status",             GetStatus)
             .WithName("CamplyStatus")
             .WithSummary("Bridge health + running job list.");

        group.MapPost("/jobs",              StartJob)
             .WithName("CamplyStartJob")
             .WithSummary("Start a new daemon search job.");

        group.MapDelete("/jobs/{jobId}",    StopJob)
             .WithName("CamplyStopJob")
             .WithSummary("Stop a running search job.");

        group.MapGet("/search/campgrounds",      SearchCampgrounds)
             .WithName("SearchCampgrounds")
             .WithSummary("List/search campgrounds for a provider.");

        group.MapGet("/search/recreation-areas", SearchRecAreas)
             .WithName("SearchRecAreas")
             .WithSummary("Search recreation areas for a provider by keyword.");
    }

    private static async Task<IResult> OneShot(
        OneShotRequest body,
        ICamplyBridgeClient bridge,
        ILogger<CamplyBridgeClient> logger)
    {
        try
        {
            var result = await bridge.RequestOneShotAsync(body);
            return Results.Accepted($"/api/camply/jobs/{result.JobId}", result);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Bridge error during one-shot request");
            return Results.Problem(ex.Message, statusCode: 502);
        }
    }

    private static async Task<IResult> GetStatus(
        ICamplyBridgeClient bridge,
        ILogger<CamplyBridgeClient> logger)
    {
        try
        {
            var status = await bridge.GetStatusAsync();
            return Results.Ok(status);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Bridge unreachable at GET /api/camply/status");
            return Results.Problem("camply-bridge unreachable: " + ex.Message, statusCode: 502);
        }
    }

    private static async Task<IResult> StartJob(
        StartJobRequest body,
        ICamplyBridgeClient bridge,
        ILogger<CamplyBridgeClient> logger)
    {
        try
        {
            var result = await bridge.StartJobAsync(body);
            return Results.Accepted($"/api/camply/jobs/{result.JobId}", result);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Bridge error starting job");
            return Results.Problem(ex.Message, statusCode: 502);
        }
    }

    private static async Task<IResult> StopJob(
        string jobId,
        ICamplyBridgeClient bridge,
        ILogger<CamplyBridgeClient> logger)
    {
        try
        {
            var result = await bridge.StopJobAsync(jobId);
            return Results.Ok(result);
        }
        catch (HttpRequestException ex) when (ex.StatusCode == System.Net.HttpStatusCode.NotFound)
        {
            return Results.NotFound(new { jobId, error = "Job not found in bridge." });
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Bridge error stopping job {JobId}", jobId);
            return Results.Problem(ex.Message, statusCode: 502);
        }
    }

    private static async Task<IResult> SearchCampgrounds(
        string provider,
        string? q,
        ICamplyBridgeClient bridge,
        ILogger<CamplyBridgeClient> logger)
    {
        try
        {
            var result = await bridge.SearchCampgroundsAsync(provider, q ?? "");
            return Results.Ok(result);
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Campground search failed for provider {Provider}", provider);
            return Results.Ok(new CamplySearchResponse([], provider)); // graceful empty — UI shows manual fallback
        }
    }

    private static async Task<IResult> SearchRecAreas(
        string provider,
        string? q,
        ICamplyBridgeClient bridge,
        ILogger<CamplyBridgeClient> logger)
    {
        try
        {
            var result = await bridge.SearchRecAreasAsync(provider, q ?? "");
            return Results.Ok(result);
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Rec-area search failed for provider {Provider}", provider);
            return Results.Ok(new CamplySearchResponse([], provider));
        }
    }
}
