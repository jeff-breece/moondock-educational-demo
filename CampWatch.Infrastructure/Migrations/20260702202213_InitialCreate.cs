using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CampWatch.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "CampsiteResults",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    CampgroundName = table.Column<string>(type: "TEXT", nullable: false),
                    Provider = table.Column<string>(type: "TEXT", nullable: false),
                    SiteId = table.Column<string>(type: "TEXT", nullable: false),
                    SiteType = table.Column<string>(type: "TEXT", nullable: false),
                    IsReservable = table.Column<bool>(type: "INTEGER", nullable: false),
                    CheckIn = table.Column<string>(type: "TEXT", nullable: false),
                    CheckOut = table.Column<string>(type: "TEXT", nullable: false),
                    BookingUrl = table.Column<string>(type: "TEXT", nullable: false),
                    MatchScore = table.Column<int>(type: "INTEGER", nullable: false),
                    Status = table.Column<int>(type: "INTEGER", nullable: false),
                    ReceivedAt = table.Column<string>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CampsiteResults", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Outings",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Date = table.Column<string>(type: "TEXT", nullable: false),
                    Location = table.Column<string>(type: "TEXT", nullable: false),
                    Notes = table.Column<string>(type: "TEXT", nullable: true),
                    DurationDays = table.Column<int>(type: "INTEGER", nullable: false),
                    RecordedAt = table.Column<string>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Outings", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Preferences",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    ProfileName = table.Column<string>(type: "TEXT", nullable: false),
                    IsActive = table.Column<bool>(type: "INTEGER", nullable: false),
                    WoodedWeight = table.Column<int>(type: "INTEGER", nullable: false),
                    RemoteWeight = table.Column<int>(type: "INTEGER", nullable: false),
                    PrivateWeight = table.Column<int>(type: "INTEGER", nullable: false),
                    HikingWeight = table.Column<int>(type: "INTEGER", nullable: false),
                    RiverWeight = table.Column<int>(type: "INTEGER", nullable: false),
                    LakeWeight = table.Column<int>(type: "INTEGER", nullable: false),
                    MinNights = table.Column<int>(type: "INTEGER", nullable: false),
                    MaxNights = table.Column<int>(type: "INTEGER", nullable: false),
                    SearchWindowDays = table.Column<int>(type: "INTEGER", nullable: false),
                    NudgeThresholdScore = table.Column<int>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Preferences", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "SearchProfiles",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Name = table.Column<string>(type: "TEXT", nullable: false),
                    Provider = table.Column<string>(type: "TEXT", nullable: false),
                    CampgroundIdsJson = table.Column<string>(type: "TEXT", nullable: false),
                    StartDate = table.Column<string>(type: "TEXT", nullable: false),
                    EndDate = table.Column<string>(type: "TEXT", nullable: false),
                    Nights = table.Column<int>(type: "INTEGER", nullable: false),
                    EquipmentJson = table.Column<string>(type: "TEXT", nullable: false),
                    IsActive = table.Column<bool>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SearchProfiles", x => x.Id);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CampsiteResults");

            migrationBuilder.DropTable(
                name: "Outings");

            migrationBuilder.DropTable(
                name: "Preferences");

            migrationBuilder.DropTable(
                name: "SearchProfiles");
        }
    }
}
