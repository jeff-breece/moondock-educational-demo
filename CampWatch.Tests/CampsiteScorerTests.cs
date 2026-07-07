using CampWatch.Api.Services;
using CampWatch.Infrastructure.Models;
using NUnit.Framework;

namespace CampWatch.Tests;

/// <summary>
/// Tests for CampsiteScorer covering the three spec-required scenarios
/// plus edge cases (clamp, unknown type, penalty short-circuit).
/// </summary>
[TestFixture]
public class CampsiteScorerTests
{
    private CampsiteScorer _scorer = null!;
    private CampsitePreferences _moondock = null!;

    [SetUp]
    public void SetUp()
    {
        _scorer = new CampsiteScorer();

        // Moondock profile (mirrors campwatch-preferences.yaml seed)
        _moondock = new CampsitePreferences
        {
            WoodedWeight       = 8,
            RemoteWeight       = 9,
            PrivateWeight      = 9,
            HikingWeight       = 7,
            RiverWeight        = 4,
            LakeWeight         = 3,
            NudgeThresholdScore = 65,
        };
    }

    private static CamplyAvailableCampsite MakeSite(string siteType) => new()
    {
        CampsiteId           = "99999",
        CampsiteType         = siteType,
        BookingDate          = DateTimeOffset.UtcNow,
        BookingEndDate       = DateTimeOffset.UtcNow.AddDays(2),
        BookingNights        = 2,
        FacilityName         = "Test Campground",
        FacilityId           = "1",
        RecreationArea       = "Test Area",
        RecreationAreaId     = "1",
        BookingUrl           = "https://example.com",
        AvailabilityStatus   = "Available",
    };

    // --- Spec-required test cases ---

    [Test]
    public void HighScore_WoodedPrimitive_AtLeast80()
    {
        // WOODED + PRIMITIVE = remote, private, wooded tags all fire; PRIMITIVE bonus applies
        var site  = MakeSite("WOODED_NONELECTRIC_PRIMITIVE");
        var score = _scorer.Score(site, _moondock);

        Assert.That(score, Is.GreaterThanOrEqualTo(80),
            $"Expected ≥80 for wooded/primitive site but got {score}");
    }

    [Test]
    public void LowScore_ElectricRvSite_AtMost20()
    {
        // FULL_HOOKUP penalty = -50 → score ≤ 20
        var site  = MakeSite("FULL_HOOKUP");
        var score = _scorer.Score(site, _moondock);

        Assert.That(score, Is.LessThanOrEqualTo(20),
            $"Expected ≤20 for FULL_HOOKUP RV site but got {score}");
    }

    [Test]
    public void LowScore_RvLoop_AtMost20()
    {
        // RV_LOOP penalty = -80 → should clamp near 0
        var site  = MakeSite("RV_LOOP");
        var score = _scorer.Score(site, _moondock);

        Assert.That(score, Is.LessThanOrEqualTo(20),
            $"Expected ≤20 for RV_LOOP site but got {score}");
    }

    [Test]
    public void DefaultScore_UntaggedSite_BetweenThirtyAndSixty()
    {
        // Site with an unrecognised type string → neutral base 40
        var site  = MakeSite("STANDARD_NONELECTRIC");
        var score = _scorer.Score(site, _moondock);

        Assert.That(score, Is.InRange(30, 60),
            $"Expected 30–60 for untagged site but got {score}");
    }

    // --- Extra guard rails ---

    [Test]
    public void Score_IsAlwaysClamped_Between0And100()
    {
        var maxPrefs = new CampsitePreferences
        {
            WoodedWeight = 10, RemoteWeight = 10, PrivateWeight = 10,
            HikingWeight = 10, RiverWeight  = 10, LakeWeight    = 10,
        };
        var superSite = MakeSite("WOODED_PRIMITIVE_WALK_IN_TENT_ONLY_NONELECTRIC_RIVER");
        var score     = _scorer.Score(superSite, maxPrefs);

        Assert.That(score, Is.LessThanOrEqualTo(100));
        Assert.That(score, Is.GreaterThanOrEqualTo(0));
    }

    [Test]
    public void Score_NullSiteType_DoesNotThrow()
    {
        var site = MakeSite(null!);
        Assert.DoesNotThrow(() => _scorer.Score(site, _moondock));
    }

    [Test]
    public void Score_TentOnlyNonelectric_HigherThanStandard()
    {
        var tent     = _scorer.Score(MakeSite("TENT_ONLY_NONELECTRIC"), _moondock);
        var standard = _scorer.Score(MakeSite("STANDARD_NONELECTRIC"), _moondock);
        Assert.That(tent, Is.GreaterThan(standard));
    }
}
