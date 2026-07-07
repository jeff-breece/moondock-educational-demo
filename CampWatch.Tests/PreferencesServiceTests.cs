using CampWatch.Infrastructure;
using CampWatch.Infrastructure.Models;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using NUnit.Framework;

namespace CampWatch.Tests;

/// <summary>
/// CRUD roundtrip tests for CampsitePreferences via CampWatchDbContext.
/// Uses an in-memory SQLite connection (shared in-process) — no file I/O required.
/// </summary>
[TestFixture]
public class PreferencesServiceTests
{
    private SqliteConnection _connection = null!;
    private CampWatchDbContext _db = null!;

    [SetUp]
    public void SetUp()
    {
        // Keep-alive connection prevents SQLite in-memory DB from vanishing between calls
        _connection = new SqliteConnection("Filename=:memory:");
        _connection.Open();

        var opts = new DbContextOptionsBuilder<CampWatchDbContext>()
            .UseSqlite(_connection)
            .Options;

        _db = new CampWatchDbContext(opts);
        _db.Database.EnsureCreated();
    }

    [TearDown]
    public void TearDown()
    {
        _db.Dispose();
        _connection.Dispose();
    }

    [Test]
    public async Task Create_Then_GetAll_ReturnsOneRow()
    {
        _db.Preferences.Add(new CampsitePreferences { ProfileName = "test-profile" });
        await _db.SaveChangesAsync();

        var all = await _db.Preferences.ToListAsync();
        Assert.That(all, Has.Count.EqualTo(1));
        Assert.That(all[0].ProfileName, Is.EqualTo("test-profile"));
    }

    [Test]
    public async Task Create_AssignsId()
    {
        var pref = new CampsitePreferences { ProfileName = "id-test" };
        _db.Preferences.Add(pref);
        await _db.SaveChangesAsync();

        Assert.That(pref.Id, Is.GreaterThan(0));
    }

    [Test]
    public async Task Update_ChangesWeights()
    {
        var pref = new CampsitePreferences { ProfileName = "edit-test", WoodedWeight = 3 };
        _db.Preferences.Add(pref);
        await _db.SaveChangesAsync();

        pref.WoodedWeight = 9;
        await _db.SaveChangesAsync();

        var reloaded = await _db.Preferences.FindAsync(pref.Id);
        Assert.That(reloaded!.WoodedWeight, Is.EqualTo(9));
    }

    [Test]
    public async Task MultipleProfiles_OnlyOneActiveByDefault()
    {
        _db.Preferences.AddRange(
            new CampsitePreferences { ProfileName = "a", IsActive = true  },
            new CampsitePreferences { ProfileName = "b", IsActive = false },
            new CampsitePreferences { ProfileName = "c", IsActive = false }
        );
        await _db.SaveChangesAsync();

        var active = await _db.Preferences.Where(p => p.IsActive).ToListAsync();
        Assert.That(active, Has.Count.EqualTo(1));
        Assert.That(active[0].ProfileName, Is.EqualTo("a"));
    }

    [Test]
    public async Task MoondockDefaults_MatchYamlSeed()
    {
        // Verify the seed values from campwatch-preferences.yaml are correctly modelled
        var moondock = new CampsitePreferences
        {
            ProfileName        = "moondock",
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
        };
        _db.Preferences.Add(moondock);
        await _db.SaveChangesAsync();

        var loaded = await _db.Preferences.FirstAsync(p => p.ProfileName == "moondock");
        Assert.That(loaded.RemoteWeight,       Is.EqualTo(9));
        Assert.That(loaded.PrivateWeight,      Is.EqualTo(9));
        Assert.That(loaded.WoodedWeight,       Is.EqualTo(8));
        Assert.That(loaded.NudgeThresholdScore, Is.EqualTo(65));
    }
}
