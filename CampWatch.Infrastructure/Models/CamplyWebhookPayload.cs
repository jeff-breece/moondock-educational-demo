using System.Text.Json;
using System.Text.Json.Serialization;

namespace CampWatch.Infrastructure.Models;

/// <summary>
/// Accepts "123" (string) or 123 (integer) — camply sends integer IDs for rec.gov/OhioStateParks.
/// </summary>
public class IntOrStringJsonConverter : JsonConverter<string>
{
    public override string Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options) =>
        reader.TokenType == JsonTokenType.Number
            ? reader.GetInt64().ToString()
            : reader.GetString() ?? "";

    public override void Write(Utf8JsonWriter writer, string value, JsonSerializerOptions options) =>
        writer.WriteStringValue(value);
}

/// <summary>
/// Native deserialization shape for camply's WebhookBody payload.
/// Field names match camply's snake_case JSON exactly — no NamingPolicy needed.
/// Ref: camply.utils.notifications.webhook (AvailableCampsite, WebhookBody)
/// </summary>
public sealed class CamplyWebhookPayload
{
    [JsonPropertyName("campsites")]
    public List<CamplyAvailableCampsite> Campsites { get; set; } = [];

    [JsonPropertyName("timestamp")]
    public DateTimeOffset Timestamp { get; set; }
}

public sealed class CamplyAvailableCampsite
{
    [JsonPropertyName("campsite_id")]
    [JsonConverter(typeof(IntOrStringJsonConverter))]
    public string CampsiteId { get; set; } = "";

    [JsonPropertyName("booking_date")]
    public DateTimeOffset BookingDate { get; set; }

    [JsonPropertyName("booking_end_date")]
    public DateTimeOffset BookingEndDate { get; set; }

    [JsonPropertyName("booking_nights")]
    public int BookingNights { get; set; }

    [JsonPropertyName("campsite_site_name")]
    public string CampsiteSiteName { get; set; } = "";

    [JsonPropertyName("campsite_loop_name")]
    public string? CampsiteLoopName { get; set; }

    [JsonPropertyName("campsite_type")]
    public string? CampsiteType { get; set; }

    /// <summary>Tuple stored as a 2-element JSON array [min, max].</summary>
    [JsonPropertyName("campsite_occupancy")]
    public int[] CampsiteOccupancy { get; set; } = [0, 0];

    [JsonPropertyName("campsite_use_type")]
    public string? CampsiteUseType { get; set; }

    [JsonPropertyName("availability_status")]
    public string AvailabilityStatus { get; set; } = "";

    [JsonPropertyName("recreation_area")]
    public string RecreationArea { get; set; } = "";

    [JsonPropertyName("recreation_area_id")]
    [JsonConverter(typeof(IntOrStringJsonConverter))]
    public string RecreationAreaId { get; set; } = "";

    [JsonPropertyName("facility_name")]
    public string FacilityName { get; set; } = "";

    [JsonPropertyName("facility_id")]
    [JsonConverter(typeof(IntOrStringJsonConverter))]
    public string FacilityId { get; set; } = "";

    [JsonPropertyName("booking_url")]
    public string BookingUrl { get; set; } = "";

    // Optional nested objects — not persisted in MVP; reserved for future use
    [JsonPropertyName("location")]
    public object? Location { get; set; }

    [JsonPropertyName("permitted_equipment")]
    public object? PermittedEquipment { get; set; }

    [JsonPropertyName("campsite_attributes")]
    public object? CampsiteAttributes { get; set; }
}
