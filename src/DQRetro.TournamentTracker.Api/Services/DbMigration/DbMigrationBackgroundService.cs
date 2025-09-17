using System.Reflection;
using DbUp;
using DbUp.Engine;

namespace DQRetro.TournamentTracker.Api.Services.DbMigration;

public sealed class DbMigrationBackgroundService : BackgroundService
{
    private readonly string _connectionString;
    private readonly ILogger<DbMigrationBackgroundService> _logger;

    public DbMigrationBackgroundService(string connectionString, ILogger<DbMigrationBackgroundService> logger)
    {
        _connectionString = connectionString;
        _logger = logger;
    }

    protected override Task ExecuteAsync(CancellationToken stoppingToken)
    {
        UpgradeEngine migrationEngine = DeployChanges.To.SqlDatabase(_connectionString)
                                                        .WithScriptsEmbeddedInAssembly(Assembly.GetExecutingAssembly())
                                                        .LogToConsole()
                                                        .Build();

        DatabaseUpgradeResult migrationResult = migrationEngine.PerformUpgrade();
        if (!migrationResult.Successful)
        {
            _logger.LogCritical(migrationResult.Error, "Database migration failed with '{Message}' and ErrorScript '{ErrorScript}'. The application cannot continue running, as the database may be in an invalid state", migrationResult.Error.Message, migrationResult.ErrorScript);
            return Task.FromException(migrationResult.Error);
        }
        else
        {
            _logger.LogInformation("Database migration completed successfully");
            return Task.CompletedTask;
        }
    }
}
