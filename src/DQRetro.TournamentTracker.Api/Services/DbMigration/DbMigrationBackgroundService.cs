using System.Reflection;
using DbUp;
using DbUp.Engine;

namespace DQRetro.TournamentTracker.Api.Services.DbMigration;

/// <summary>
/// Background service to run on start-up and ensure the database is correctly migrated.
/// This assumes that the database is created, and that the Login specified in the connection string exists.
/// </summary>
public sealed class DbMigrationBackgroundService : BackgroundService
{
    private readonly string _connectionString;
    private readonly ILogger<DbMigrationBackgroundService> _logger;

    /// <summary>
    /// Ctor.
    /// </summary>
    /// <param name="connectionString">Database connection string used for executing migrations.</param>
    /// <param name="logger">Logger instance to output whether migrations were successful.</param>
    public DbMigrationBackgroundService(string connectionString, ILogger<DbMigrationBackgroundService> logger)
    {
        _connectionString = connectionString;
        _logger = logger;
    }

    /// <summary>
    /// Main migration method that's automatically executed when the service is registered.
    /// </summary>
    /// <param name="stoppingToken">Cancellation token (shouldn't be relevant here, as this should exit fairly quickly).</param>
    /// <returns>Completed, or faulted task.</returns>
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
