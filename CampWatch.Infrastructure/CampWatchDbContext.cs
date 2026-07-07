using CampWatch.Infrastructure.Models;
using Microsoft.EntityFrameworkCore;

namespace CampWatch.Infrastructure;

/// <summary>
/// EF Core DbContext for CampWatch v2.
/// DB file: /mnt/raid/data/campwatch.db (SQLite, RAID-persisted).
/// Swap provider: replace Microsoft.EntityFrameworkCore.Sqlite with
/// Npgsql.EntityFrameworkCore.PostgreSQL and update the connection string.
/// </summary>
public class CampWatchDbContext(DbContextOptions<CampWatchDbContext> options)
    : DbContext(options)
{
    public DbSet<CampsiteSearchResult> CampsiteResults => Set<CampsiteSearchResult>();
    public DbSet<CampsitePreferences>  Preferences     => Set<CampsitePreferences>();
    public DbSet<SearchProfile>        SearchProfiles  => Set<SearchProfile>();
    public DbSet<OutingLog>            Outings         => Set<OutingLog>();
    public DbSet<TripPlan>             TripPlans       => Set<TripPlan>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // SQLite doesn't support DateOnly natively; store as TEXT ISO-8601
        modelBuilder.Entity<CampsiteSearchResult>(b =>
        {
            b.Property(r => r.CheckIn)
             .HasConversion(d => d.ToString("yyyy-MM-dd"), s => DateOnly.Parse(s));
            b.Property(r => r.CheckOut)
             .HasConversion(d => d.ToString("yyyy-MM-dd"), s => DateOnly.Parse(s));
            b.Property(r => r.ReceivedAt)
             .HasConversion(d => d.ToString("o"), s => DateTimeOffset.Parse(s));
        });

        modelBuilder.Entity<OutingLog>(b =>
        {
            b.Property(o => o.Date)
             .HasConversion(d => d.ToString("yyyy-MM-dd"), s => DateOnly.Parse(s));
            b.Property(o => o.RecordedAt)
             .HasConversion(d => d.ToString("o"), s => DateTimeOffset.Parse(s));
        });

        modelBuilder.Entity<TripPlan>(b =>
        {
            b.Property(t => t.CreatedAt)
             .HasConversion(d => d.ToString("o"), s => DateTimeOffset.Parse(s));
            b.Property(t => t.UpdatedAt)
             .HasConversion(d => d.ToString("o"), s => DateTimeOffset.Parse(s));
        });
    }
}
