namespace CampWatch.Api.Routes;

public static class PhotoRoutes
{
    private const string PhotoDir = "/mnt/raid/data/campwatch-photos";

    /// <summary>Maximum accepted upload size (20 MB). Larger uploads get 413.</summary>
    public const long MaxBytes = 20L * 1024 * 1024;

    public static readonly string[] AllowedExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp"];

    public static void MapPhotoRoutes(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/photos");

        group.MapPost("/", UploadPhoto)
             .WithName("UploadPhoto")
             .DisableAntiforgery();

        group.MapGet("/{filename}", ServePhoto)
             .WithName("ServePhoto");
    }

    /// <summary>
    /// Validates an uploaded photo. Returns a <see cref="PhotoValidationError"/>
    /// (status code + message) when invalid, or null when the file is acceptable.
    /// Extracted so the rules are unit-testable without an HTTP stack (#201).
    /// </summary>
    public static PhotoValidationError? Validate(string? fileName, long length)
    {
        if (length <= 0)
            return new PhotoValidationError(400, "No file provided.");

        if (length > MaxBytes)
            return new PhotoValidationError(413, $"File too large. Maximum size is {MaxBytes / (1024 * 1024)} MB.");

        var ext = Path.GetExtension(fileName ?? "").ToLowerInvariant();
        if (!AllowedExtensions.Contains(ext))
            return new PhotoValidationError(415, $"Unsupported file type '{ext}'. Allowed: {string.Join(", ", AllowedExtensions)}.");

        return null;
    }

    private static async Task<IResult> UploadPhoto(IFormFile? file, ILogger<Program> logger)
    {
        var error = Validate(file?.FileName, file?.Length ?? 0);
        if (error is not null)
        {
            logger.LogWarning("Photo upload rejected ({Status}): {Message}", error.StatusCode, error.Message);
            return Results.Json(new { error = error.Message }, statusCode: error.StatusCode);
        }

        Directory.CreateDirectory(PhotoDir);

        var ext = Path.GetExtension(file!.FileName).ToLowerInvariant();
        var filename = $"{Guid.NewGuid():N}{ext}";
        var path = Path.Combine(PhotoDir, filename);

        await using var stream = File.Create(path);
        await file.CopyToAsync(stream);

        logger.LogInformation("Photo uploaded: {Filename} ({Bytes} bytes)", filename, file.Length);
        return Results.Ok(new { filename, url = $"/api/photos/{filename}" });
    }

    private static IResult ServePhoto(string filename)
    {
        // Prevent path traversal
        if (filename.Contains('/') || filename.Contains('\\') || filename.StartsWith('.'))
            return Results.BadRequest("Invalid filename.");

        var path = Path.Combine(PhotoDir, filename);
        if (!File.Exists(path))
            return Results.NotFound();

        var contentType = Path.GetExtension(filename).ToLowerInvariant() switch
        {
            ".jpg" or ".jpeg" => "image/jpeg",
            ".png"            => "image/png",
            ".gif"            => "image/gif",
            ".webp"           => "image/webp",
            _                 => "application/octet-stream"
        };

        return Results.File(path, contentType);
    }
}

/// <summary>Validation failure for a photo upload: HTTP status code + message.</summary>
public sealed record PhotoValidationError(int StatusCode, string Message);
