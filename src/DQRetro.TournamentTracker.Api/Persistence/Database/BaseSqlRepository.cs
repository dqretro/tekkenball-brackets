using DQRetro.TournamentTracker.Api.Models.Configuration;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Options;

namespace DQRetro.TournamentTracker.Api.Persistence.Database;

/// <summary>
/// Concrete implementation of Base SQL Repository, containing common methods used throughout different SQL Repositories.
/// </summary>
public class BaseSqlRepository
{
    private readonly string _connectionString;

    /// <summary>
    /// Ctor.
    /// </summary>
    /// <param name="keyOptions">KeyOptions containing the SQL connection string.</param>
    public BaseSqlRepository(IOptions<KeysConfiguration> keyOptions)
    {
        _connectionString = keyOptions.Value.SqlConnectionString;
    }

    /// <summary>
    /// Creates or retrieves a connection from the connection pool, opens it and returns it.
    /// Note - Consumers are responsible for disposing of connections after use.
    /// </summary>
    /// <returns>An opened SQL connection.</returns>
    protected async Task<SqlConnection> OpenConnectionAsync()
    {
        SqlConnection connection = new(_connectionString);
        await connection.OpenAsync();
        return connection;
    }
}
