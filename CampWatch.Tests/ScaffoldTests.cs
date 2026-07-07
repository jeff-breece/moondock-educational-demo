namespace CampWatch.Tests;

/// <summary>
/// Scaffold smoke test — verifies the test runner and project references work.
/// Real test fixtures are added per issues #186–#192.
/// </summary>
[TestFixture]
public class ScaffoldTests
{
    [Test]
    public void Scaffold_IsReachable()
    {
        // Confirms NUnit, project references, and build pipeline are functional.
        Assert.Pass("CampWatch.Tests scaffold is healthy.");
    }
}

