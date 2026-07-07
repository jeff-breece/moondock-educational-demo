#pragma warning disable CS0618 // Obsolete — intentional: testing the legacy shim
using CampWatch.Api.Helpers;
using NUnit.Framework;

namespace CampWatch.Tests;

/// <summary>
/// Regression suite for CamplyResultParser.
/// These tests pin the legacy stdout-parse behavior so any future refactor
/// doesn't silently break parsing of stored prototype-era log strings.
/// </summary>
[TestFixture]
public class CamplyResultParserTests
{
    // Representative log line from camply's human-readable logger
    private const string ValidLine =
        "2026-07-01 08:00:00.123456 | INFO | Available Camping 🏕  at Stewart Lake SP, " +
        "Site #23735: 2026-08-15 - 2026-08-17 (2 nights) - https://reservations.ohio.gov/camping/site/23735";

    [Test]
    public void TryParse_ValidLine_ReturnsResult()
    {
        var result = CamplyResultParser.TryParse(ValidLine);
        Assert.That(result, Is.Not.Null);
    }

    [Test]
    public void TryParse_ValidLine_FacilityNameExtracted()
    {
        var result = CamplyResultParser.TryParse(ValidLine)!;
        Assert.That(result.FacilityName, Does.Contain("Stewart Lake SP"));
    }

    [Test]
    public void TryParse_ValidLine_SiteIdExtracted()
    {
        var result = CamplyResultParser.TryParse(ValidLine)!;
        Assert.That(result.SiteId, Is.EqualTo("23735"));
    }

    [Test]
    public void TryParse_ValidLine_DatesExtracted()
    {
        var result = CamplyResultParser.TryParse(ValidLine)!;
        Assert.That(result.CheckIn,  Is.EqualTo("2026-08-15"));
        Assert.That(result.CheckOut, Is.EqualTo("2026-08-17"));
    }

    [Test]
    public void TryParse_ValidLine_BookingUrlExtracted()
    {
        var result = CamplyResultParser.TryParse(ValidLine)!;
        Assert.That(result.BookingUrl, Does.StartWith("https://"));
    }

    [Test]
    public void TryParse_GarbageLine_ReturnsNull()
    {
        var result = CamplyResultParser.TryParse("This is not a camply log line at all");
        Assert.That(result, Is.Null);
    }

    [Test]
    public void TryParse_EmptyString_ReturnsNull()
    {
        var result = CamplyResultParser.TryParse(string.Empty);
        Assert.That(result, Is.Null);
    }
}
#pragma warning restore CS0618
