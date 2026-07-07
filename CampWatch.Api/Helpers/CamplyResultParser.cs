using System.Text.RegularExpressions;

namespace CampWatch.Api.Helpers;

/// <summary>
/// Legacy shim: parses campsite info from camply's human-readable stdout lines.
/// The current webhook integration path (issue #186+) writes structured JSON — this parser
/// exists only for backward compatibility with any stored stdout strings from the
/// prototype phase. New code must not call this; use CamplyWebhookPayload instead.
/// </summary>
[Obsolete("Use CamplyWebhookPayload deserialization. This parser is kept for prototype-era stdout strings only.")]
public static partial class CamplyResultParser
{
    // Matches camply info log lines:
    // "2024-07-01 08:00:00.123456 | INFO | Available Camping 🏕  at Stewart Lake SP, Site #23735: 2026-08-15 - 2026-08-17 (2 nights) - https://..."
    [GeneratedRegex(
        @"(?<date>\d{4}-\d{2}-\d{2})\s+\d{2}:\d{2}:\d{2}.*?at\s+(?<facility>.+?),\s+Site\s+#(?<siteId>\d+):\s+(?<checkIn>\d{4}-\d{2}-\d{2})\s*-\s*(?<checkOut>\d{4}-\d{2}-\d{2})(?:.*-\s+(?<url>https?://\S+))?",
        RegexOptions.IgnoreCase | RegexOptions.Compiled,
        matchTimeoutMilliseconds: 1000)]
    private static partial Regex LogLinePattern();

    /// <summary>
    /// Attempts to extract a minimal campsite record from a camply stdout log line.
    /// Returns null if the line does not match the expected format.
    /// </summary>
    public static ParsedCampsiteResult? TryParse(string logLine)
    {
        ArgumentNullException.ThrowIfNull(logLine);

        var m = LogLinePattern().Match(logLine);
        if (!m.Success) return null;

        return new ParsedCampsiteResult(
            FacilityName: m.Groups["facility"].Value.Trim(),
            SiteId:       m.Groups["siteId"].Value.Trim(),
            CheckIn:      m.Groups["checkIn"].Value.Trim(),
            CheckOut:     m.Groups["checkOut"].Value.Trim(),
            BookingUrl:   m.Groups["url"].Value.Trim()
        );
    }
}

/// <param name="FacilityName">Campground/facility name extracted from log line.</param>
/// <param name="SiteId">Campsite ID string (numeric).</param>
/// <param name="CheckIn">ISO date string YYYY-MM-DD.</param>
/// <param name="CheckOut">ISO date string YYYY-MM-DD.</param>
/// <param name="BookingUrl">Booking URL if present in the line, else empty string.</param>
[Obsolete("Use CamplyWebhookPayload deserialization instead.")]
public sealed record ParsedCampsiteResult(
    string FacilityName,
    string SiteId,
    string CheckIn,
    string CheckOut,
    string BookingUrl
);
