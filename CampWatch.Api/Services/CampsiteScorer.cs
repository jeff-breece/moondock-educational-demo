using CampWatch.Infrastructure.Models;

namespace CampWatch.Api.Services;

/// <summary>
/// Scores a single camply-reported campsite against a preference profile.
/// Returns an integer in [0, 100].
///
/// Scoring model (derived from moondock profile):
///   Terrain weights:  wooded=30, remote=25, private=20, hiking=15, river=5, lake=5
///   Penalties:        FULL_HOOKUP=-50, RV_LOOP=-80
///   Bonuses:          TENT_ONLY_NONELECTRIC=+10, PRIMITIVE=+15, WALK_IN=+10
///
/// A site with no matching type tokens receives a neutral base score of 40,
/// adjusted by preference weights if they overlap with any inferred type string.
/// Result is always clamped to [0, 100].
/// </summary>
public class CampsiteScorer
{
    // Type-string → terrain category map (case-insensitive substring match)
    private static readonly (string Tag, string Category)[] TypeCategories =
    [
        ("WOODED",     "wooded"),
        ("FOREST",     "wooded"),
        ("TREE",       "wooded"),
        ("PRIMITIVE",  "remote"),
        ("BACKCOUNTRY","remote"),
        ("WALK_IN",    "remote"),
        ("HIKE_IN",    "remote"),
        ("SECLUDED",   "private"),
        ("TENT_ONLY",  "private"),
        ("TRAIL",      "hiking"),
        ("HIKE",       "hiking"),
        ("RIVER",      "river"),
        ("CREEK",      "river"),
        ("STREAM",     "river"),
        ("LAKE",       "lake"),
        ("POND",       "lake"),
        ("WATER",      "lake"),
    ];

    // Hard penalties: RV / hookup sites score low regardless of weights
    private static readonly (string Tag, int Penalty)[] Penalties =
    [
        ("FULL_HOOKUP",  -50),
        ("RV_LOOP",      -80),
        ("RV_ELECTRIC",  -50),
    ];

    // Bonus modifiers: quality signals that override neutral baseline
    private static readonly (string Tag, int Bonus)[] Bonuses =
    [
        ("TENT_ONLY_NONELECTRIC", +10),
        ("PRIMITIVE",             +15),
        ("WALK_IN",               +10),
    ];

    /// <summary>
    /// Score a single site against the given preference profile.
    /// </summary>
    public int Score(CamplyAvailableCampsite site, CampsitePreferences prefs)
    {
        var siteType = (site.CampsiteType ?? "").ToUpperInvariant();

        // Base score: 40 (neutral — no strong signal either way)
        int score = 40;

        // Terrain weight accumulation
        score += CategoryWeight(siteType, "wooded",  prefs.WoodedWeight,  maxContribution: 30);
        score += CategoryWeight(siteType, "remote",  prefs.RemoteWeight,  maxContribution: 25);
        score += CategoryWeight(siteType, "private", prefs.PrivateWeight, maxContribution: 20);
        score += CategoryWeight(siteType, "hiking",  prefs.HikingWeight,  maxContribution: 15);
        score += CategoryWeight(siteType, "river",   prefs.RiverWeight,   maxContribution:  5);
        score += CategoryWeight(siteType, "lake",    prefs.LakeWeight,    maxContribution:  5);

        // Apply bonuses
        foreach (var (tag, bonus) in Bonuses)
        {
            if (siteType.Contains(tag, StringComparison.Ordinal))
                score += bonus;
        }

        // Apply penalties last — disqualifying site types drive score below threshold
        foreach (var (tag, penalty) in Penalties)
        {
            if (siteType.Contains(tag, StringComparison.Ordinal))
                score += penalty;
        }

        return Math.Clamp(score, 0, 100);
    }

    private static int CategoryWeight(
        string siteType, string category, int weight, int maxContribution)
    {
        // Does the site type string match any tag in this category?
        bool matched = TypeCategories
            .Where(t => t.Category == category)
            .Any(t => siteType.Contains(t.Tag, StringComparison.Ordinal));

        if (!matched) return 0;

        // Scale: weight 0–10 maps linearly to 0–maxContribution
        return (int)Math.Round(weight / 10.0 * maxContribution);
    }
}
