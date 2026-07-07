using System.Net;
using System.Net.Http.Json;
using CampWatch.Api.Services;
using RichardSzalay.MockHttp;

namespace CampWatch.Tests;

/// <summary>
/// Unit tests for CamplyBridgeClient — mocks the HTTP transport so no
/// running bridge container is required.  Integration tests (tagged
/// [Category("Integration")]) hit a live bridge and are skipped in CI.
/// </summary>
[TestFixture]
public class BridgeClientTests
{
    // ------------------------------------------------------------------
    // /health
    // ------------------------------------------------------------------

    [Test]
    public async Task GetHealth_WhenBridgeIsUp_ReturnsOkWithJobCount()
    {
        var mock = new MockHttpMessageHandler();
        mock.When(HttpMethod.Get, "http://bridge/health")
            .Respond("application/json",
                """{"status":"ok","service":"camply-bridge","jobs":2}""");

        var client = BuildClient(mock);
        var result = await client.GetHealthAsync();

        Assert.Multiple(() =>
        {
            Assert.That(result.Status, Is.EqualTo("ok"));
            Assert.That(result.Service, Is.EqualTo("camply-bridge"));
            Assert.That(result.Jobs, Is.EqualTo(2));
        });
    }

    [Test]
    public void GetHealth_WhenBridgeIsDown_ThrowsHttpRequestException()
    {
        var mock = new MockHttpMessageHandler();
        mock.When(HttpMethod.Get, "http://bridge/health")
            .Respond(HttpStatusCode.ServiceUnavailable);

        var client = BuildClient(mock);
        Assert.ThrowsAsync<HttpRequestException>(() => client.GetHealthAsync());
    }

    // ------------------------------------------------------------------
    // POST /camply/jobs
    // ------------------------------------------------------------------

    [Test]
    public async Task StartJob_WithValidRequest_Returns202WithJobId()
    {
        var mock = new MockHttpMessageHandler();
        mock.When(HttpMethod.Post, "http://bridge/camply/jobs")
            .Respond(HttpStatusCode.Accepted, "application/json",
                """{"job_id":"abc123","status":"starting"}""");

        var client = BuildClient(mock);
        var req = new StartJobRequest(
            ProfileName: "moondock",
            Provider: "OhioStateParks",
            CampgroundIds: ["554"],
            StartDate: "2026-08-01",
            EndDate: "2026-12-31",
            Nights: 2
        );

        var result = await client.StartJobAsync(req);

        Assert.Multiple(() =>
        {
            Assert.That(result.JobId, Is.EqualTo("abc123"));
            Assert.That(result.Status, Is.EqualTo("starting"));
        });
    }

    [Test]
    public void StartJob_WhenBridgeReturns400_ThrowsHttpRequestException()
    {
        var mock = new MockHttpMessageHandler();
        mock.When(HttpMethod.Post, "http://bridge/camply/jobs")
            .Respond(HttpStatusCode.BadRequest, "application/json",
                """{"error":"Missing required fields: start_date"}""");

        var client = BuildClient(mock);
        var badReq = new StartJobRequest("test", "OhioStateParks", ["554"],
            StartDate: "", EndDate: "2026-12-31");

        Assert.ThrowsAsync<HttpRequestException>(() => client.StartJobAsync(badReq));
    }

    // ------------------------------------------------------------------
    // DELETE /camply/jobs/{id}
    // ------------------------------------------------------------------

    [Test]
    public async Task StopJob_WhenJobExists_ReturnsStoppedStatus()
    {
        var mock = new MockHttpMessageHandler();
        mock.When(HttpMethod.Delete, "http://bridge/camply/jobs/abc123")
            .Respond("application/json",
                """{"job_id":"abc123","status":"stopped"}""");

        var client = BuildClient(mock);
        var result = await client.StopJobAsync("abc123");

        Assert.Multiple(() =>
        {
            Assert.That(result.JobId, Is.EqualTo("abc123"));
            Assert.That(result.Status, Is.EqualTo("stopped"));
        });
    }

    [Test]
    public void StopJob_WhenJobNotFound_ThrowsHttpRequestException()
    {
        var mock = new MockHttpMessageHandler();
        mock.When(HttpMethod.Delete, "http://bridge/camply/jobs/missing")
            .Respond(HttpStatusCode.NotFound, "application/json",
                """{"error":"job not found"}""");

        var client = BuildClient(mock);
        Assert.ThrowsAsync<HttpRequestException>(() => client.StopJobAsync("missing"));
    }

    // ------------------------------------------------------------------
    // GET /camply/status
    // ------------------------------------------------------------------

    [Test]
    public async Task GetStatus_ReturnsBridgeStatusWithJobList()
    {
        var mock = new MockHttpMessageHandler();
        mock.When(HttpMethod.Get, "http://bridge/camply/status")
            .Respond("application/json", """
                {
                    "jobs": [
                        {
                            "id":"abc123","profile_name":"moondock","provider":"OhioStateParks",
                            "campground_ids":["554"],"start_date":"2026-08-01",
                            "end_date":"2026-12-31","nights":2,"status":"running",
                            "pid":1234,"started_at":"2026-07-02T16:00:00Z",
                            "ended_at":null,"error":null
                        }
                    ],
                    "api_url":"http://campwatch-api:8080",
                    "webhook_endpoint":"http://campwatch-api:8080/api/webhook/camply"
                }
                """);

        var client = BuildClient(mock);
        var result = await client.GetStatusAsync();

        Assert.Multiple(() =>
        {
            Assert.That(result.Jobs, Has.Length.EqualTo(1));
            Assert.That(result.Jobs[0].Status, Is.EqualTo("running"));
            Assert.That(result.Jobs[0].Provider, Is.EqualTo("OhioStateParks"));
        });
    }

    // ------------------------------------------------------------------
    // POST /camply/request (one-shot)
    // ------------------------------------------------------------------

    [Test]
    public async Task RequestOneShot_ReturnsAcceptedWithJobId()
    {
        var mock = new MockHttpMessageHandler();
        mock.When(HttpMethod.Post, "http://bridge/camply/request")
            .Respond(HttpStatusCode.Accepted, "application/json",
                """{"job_id":"shot01","status":"starting"}""");

        var client = BuildClient(mock);
        var req = new OneShotRequest("OhioStateParks", ["554"], "2026-08-01", "2026-08-31");
        var result = await client.RequestOneShotAsync(req);

        Assert.That(result.JobId, Is.EqualTo("shot01"));
    }

    // ------------------------------------------------------------------
    // Helper
    // ------------------------------------------------------------------

    private static ICamplyBridgeClient BuildClient(MockHttpMessageHandler mock)
    {
        var http = mock.ToHttpClient();
        http.BaseAddress = new Uri("http://bridge");
        return new CamplyBridgeClient(http);
    }
}
