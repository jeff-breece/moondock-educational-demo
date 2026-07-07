using CampWatch.Api.Routes;
using NUnit.Framework;

namespace CampWatch.Tests;

/// <summary>
/// Unit tests for the photo-upload validation rules (issue #201).
/// Validation is extracted from the HTTP handler so it can be exercised
/// without an ASP.NET request pipeline.
/// </summary>
[TestFixture]
public class PhotoRoutesTests
{
    [Test]
    public void Validate_EmptyFile_Returns400()
    {
        var error = PhotoRoutes.Validate("photo.jpg", 0);
        Assert.That(error, Is.Not.Null);
        Assert.That(error!.StatusCode, Is.EqualTo(400));
    }

    [Test]
    public void Validate_OversizedFile_Returns413()
    {
        var error = PhotoRoutes.Validate("photo.jpg", PhotoRoutes.MaxBytes + 1);
        Assert.That(error, Is.Not.Null);
        Assert.That(error!.StatusCode, Is.EqualTo(413));
        Assert.That(error.Message, Does.Contain("20 MB"));
    }

    [Test]
    public void Validate_AtSizeLimit_IsAccepted()
    {
        var error = PhotoRoutes.Validate("photo.jpg", PhotoRoutes.MaxBytes);
        Assert.That(error, Is.Null);
    }

    [Test]
    public void Validate_UnsupportedType_Returns415()
    {
        var error = PhotoRoutes.Validate("malware.exe", 1024);
        Assert.That(error, Is.Not.Null);
        Assert.That(error!.StatusCode, Is.EqualTo(415));
    }

    [TestCase("photo.jpg")]
    [TestCase("photo.JPEG")]
    [TestCase("photo.png")]
    [TestCase("photo.gif")]
    [TestCase("photo.webp")]
    public void Validate_AllowedTypes_AreAccepted(string fileName)
    {
        var error = PhotoRoutes.Validate(fileName, 1024);
        Assert.That(error, Is.Null);
    }

    [Test]
    public void Validate_MissingFileName_Returns415()
    {
        var error = PhotoRoutes.Validate(null, 1024);
        Assert.That(error, Is.Not.Null);
        Assert.That(error!.StatusCode, Is.EqualTo(415));
    }
}
