using System.Net.Http.Json;
using System.Text.Json;

namespace CampWatch.Api.Services;

// ---------------------------------------------------------------------------
// Serializer options — Python bridge uses snake_case
// ---------------------------------------------------------------------------
internal static class BridgeJson
{
    internal static readonly JsonSerializerOptions Options = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower,
        PropertyNameCaseInsensitive = true,
    };
}

// ---------------------------------------------------------------------------
// DTOs
// ---------------------------------------------------------------------------

public record BridgeHealthResponse(string Status, string Service, int Jobs);

public record BridgeJob(
    string Id,
    string ProfileName,
    string Provider,
    string[] CampgroundIds,
    string StartDate,
    string EndDate,
    int Nights,
    string Status,
    int? Pid,
    string StartedAt,
    string? EndedAt,
    string? Error
);

public record BridgeStatusResponse(BridgeJob[] Jobs, string ApiUrl, string WebhookEndpoint);

public record StartJobRequest(
    string ProfileName,
    string Provider,
    string[]? CampgroundIds,
    string StartDate,
    string EndDate,
    string[]? RecreationAreaIds = null,
    int Nights = 1,
    string[]? Equipment = null,
    bool Daemon = true
);

public record StartJobResponse(string JobId, string Status);

public record StopJobResponse(string JobId, string Status);

public record OneShotRequest(
    string Provider,
    string[] CampgroundIds,
    string StartDate,
    string EndDate,
    int Nights = 1,
    string[]? Equipment = null
);

public record OneShotResponse(string JobId, string Status);

// Search / discovery DTOs
public record CamplySearchItem(string Id, string Name);
public record CamplySearchResponse(CamplySearchItem[] Items, string Provider);

// ---------------------------------------------------------------------------
// Interface
// ---------------------------------------------------------------------------

public interface ICamplyBridgeClient
{
    Task<BridgeHealthResponse> GetHealthAsync(CancellationToken ct = default);
    Task<BridgeStatusResponse> GetStatusAsync(CancellationToken ct = default);
    Task<StartJobResponse> StartJobAsync(StartJobRequest request, CancellationToken ct = default);
    Task<StopJobResponse> StopJobAsync(string jobId, CancellationToken ct = default);
    Task<OneShotResponse> RequestOneShotAsync(OneShotRequest request, CancellationToken ct = default);
    Task<CamplySearchResponse> SearchCampgroundsAsync(string provider, string query = "", CancellationToken ct = default);
    Task<CamplySearchResponse> SearchRecAreasAsync(string provider, string query = "", CancellationToken ct = default);
}

// ---------------------------------------------------------------------------
// Implementation
// ---------------------------------------------------------------------------

public class CamplyBridgeClient(HttpClient http) : ICamplyBridgeClient
{
    public async Task<BridgeHealthResponse> GetHealthAsync(CancellationToken ct = default)
    {
        var response = await http.GetAsync("/health", ct);
        response.EnsureSuccessStatusCode();
        return await response.Content.ReadFromJsonAsync<BridgeHealthResponse>(BridgeJson.Options, ct)
               ?? throw new InvalidOperationException("Null response from /health");
    }

    public async Task<BridgeStatusResponse> GetStatusAsync(CancellationToken ct = default)
    {
        var response = await http.GetAsync("/camply/status", ct);
        response.EnsureSuccessStatusCode();
        return await response.Content.ReadFromJsonAsync<BridgeStatusResponse>(BridgeJson.Options, ct)
               ?? throw new InvalidOperationException("Null response from /camply/status");
    }

    public async Task<StartJobResponse> StartJobAsync(StartJobRequest request, CancellationToken ct = default)
    {
        var response = await http.PostAsJsonAsync("/camply/jobs", request, BridgeJson.Options, ct);
        response.EnsureSuccessStatusCode();
        return await response.Content.ReadFromJsonAsync<StartJobResponse>(BridgeJson.Options, ct)
               ?? throw new InvalidOperationException("Null response from POST /camply/jobs");
    }

    public async Task<StopJobResponse> StopJobAsync(string jobId, CancellationToken ct = default)
    {
        var response = await http.DeleteAsync($"/camply/jobs/{jobId}", ct);
        response.EnsureSuccessStatusCode();
        return await response.Content.ReadFromJsonAsync<StopJobResponse>(BridgeJson.Options, ct)
               ?? throw new InvalidOperationException($"Null response from DELETE /camply/jobs/{jobId}");
    }

    public async Task<OneShotResponse> RequestOneShotAsync(OneShotRequest request, CancellationToken ct = default)
    {
        var response = await http.PostAsJsonAsync("/camply/request", request, BridgeJson.Options, ct);
        response.EnsureSuccessStatusCode();
        return await response.Content.ReadFromJsonAsync<OneShotResponse>(BridgeJson.Options, ct)
               ?? throw new InvalidOperationException("Null response from POST /camply/request");
    }

    public async Task<CamplySearchResponse> SearchCampgroundsAsync(string provider, string query = "", CancellationToken ct = default)
    {
        var url = $"/camply/search/campgrounds?provider={Uri.EscapeDataString(provider)}&q={Uri.EscapeDataString(query)}";
        var response = await http.GetAsync(url, ct);
        response.EnsureSuccessStatusCode();
        return await response.Content.ReadFromJsonAsync<CamplySearchResponse>(BridgeJson.Options, ct)
               ?? new CamplySearchResponse([], provider);
    }

    public async Task<CamplySearchResponse> SearchRecAreasAsync(string provider, string query = "", CancellationToken ct = default)
    {
        var url = $"/camply/search/recreation-areas?provider={Uri.EscapeDataString(provider)}&q={Uri.EscapeDataString(query)}";
        var response = await http.GetAsync(url, ct);
        response.EnsureSuccessStatusCode();
        return await response.Content.ReadFromJsonAsync<CamplySearchResponse>(BridgeJson.Options, ct)
               ?? new CamplySearchResponse([], provider);
    }
}
