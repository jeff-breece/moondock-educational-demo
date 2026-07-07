using System.Text.Json.Serialization;
using CampWatch.Api.Hubs;
using CampWatch.Api.Routes;
using CampWatch.Api.Services;
using CampWatch.Infrastructure;
using CampWatch.Infrastructure.Models;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// ---------------------------------------------------------------------------
// Services
// ---------------------------------------------------------------------------
builder.Services.AddSignalR();
builder.Services.AddEndpointsApiExplorer();

// CORS — allow the UI origin; AllowCredentials is required for SignalR WebSocket negotiation
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy
            .WithOrigins(
                "http://10.0.100.10:3001",
                "http://192.168.2.3:3001",
                "http://localhost:3001",
                "http://localhost:5173",
                "https://campwatch.lab",
                "https://campwatch-api.lab")
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

// Serialize enums as strings (status: "New" not 0) and use camelCase
builder.Services.ConfigureHttpJsonOptions(opts =>
{
    opts.SerializerOptions.Converters.Add(new JsonStringEnumConverter());
});

// EF Core + SQLite — DB file on RAID so it persists across OS updates
var dbPath = builder.Configuration["Sqlite:DataSource"]
             ?? "/mnt/raid/data/campwatch.db";
builder.Services.AddDbContext<CampWatchDbContext>(opts =>
    opts.UseSqlite($"Data Source={dbPath}"));

// camply-bridge HttpClient
var bridgeUrl = builder.Configuration["CamplyBridge:BaseUrl"] ?? "http://localhost:8088";
builder.Services.AddHttpClient<ICamplyBridgeClient, CamplyBridgeClient>(client =>
{
    client.BaseAddress = new Uri(bridgeUrl);
    client.Timeout = TimeSpan.FromSeconds(30);
});

// Campsite scorer — stateless, registered as transient
builder.Services.AddTransient<CampsiteScorer>();

var app = builder.Build();

// ---------------------------------------------------------------------------
// Auto-migrate on startup (creates DB + schema on first run)
// ---------------------------------------------------------------------------
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<CampWatchDbContext>();
    db.Database.EnsureCreated();
    db.Database.ExecuteSqlRaw("""
        CREATE TABLE IF NOT EXISTS TripPlans (
            Id INTEGER PRIMARY KEY AUTOINCREMENT,
            Name TEXT NOT NULL DEFAULT '',
            Provider TEXT NOT NULL DEFAULT '',
            CampgroundId TEXT NOT NULL DEFAULT '',
            CampgroundName TEXT NOT NULL DEFAULT '',
            RecAreaId TEXT NOT NULL DEFAULT '',
            RecAreaName TEXT NOT NULL DEFAULT '',
            StartDate TEXT NOT NULL DEFAULT '',
            EndDate TEXT NOT NULL DEFAULT '',
            Nights INTEGER NOT NULL DEFAULT 2,
            Status TEXT NOT NULL DEFAULT 'Planned',
            Notes TEXT,
            ChecklistJson TEXT NOT NULL DEFAULT '[]',
            CreatedAt TEXT NOT NULL DEFAULT '',
            UpdatedAt TEXT NOT NULL DEFAULT ''
        )
    """);

    // Seed moondock preference profile if no preferences exist yet
    if (!await db.Preferences.AnyAsync())
    {
        db.Preferences.Add(new CampsitePreferences
        {
            ProfileName        = "moondock",
            IsActive           = true,
            WoodedWeight       = 8,
            RemoteWeight       = 9,
            PrivateWeight      = 9,
            HikingWeight       = 7,
            RiverWeight        = 4,
            LakeWeight         = 3,
            MinNights          = 2,
            MaxNights          = 5,
            SearchWindowDays   = 90,
            NudgeThresholdScore = 65,
        });
        await db.SaveChangesAsync();
    }
}

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------
app.UseCors();
app.MapGet("/health", () => Results.Ok(new { status = "ok", service = "campwatch-api", version = "2.0.0" }));
app.MapHub<CampWatchHub>("/hubs/campwatch");
app.MapWebhookRoutes();
app.MapPreferenceRoutes();
app.MapCamplyRoutes();
app.MapCampsiteRoutes();
app.MapOutingRoutes();
app.MapTripRoutes();
app.MapPhotoRoutes();

app.Run();

// Expose Program for WebApplicationFactory in integration tests
public partial class Program { }

