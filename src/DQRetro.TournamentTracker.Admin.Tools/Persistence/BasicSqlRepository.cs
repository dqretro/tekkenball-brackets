using Dapper;
using DQRetro.TournamentTracker.Admin.Tools.Models;
using Microsoft.Data.SqlClient;

namespace DQRetro.TournamentTracker.Admin.Tools.Persistence;

/// <summary>
/// Concrete implementation of basic SQL logic, such as ensuring the DB is accessible and opening new connections.
/// </summary>
public class BaseSqlRepository
{
    private readonly string _connectionString;

    /// <summary>
    /// Ctor.
    /// </summary>
    /// <param name="settings"></param>
    public BaseSqlRepository(Settings settings)
    {
        _connectionString = settings.SqlConnectionString;
    }

    /// <summary>
    /// Performs a basic SELECT 1 against the target DB.
    /// </summary>
    /// <returns>True if the Db returns 1, or an exception if unaccessible.</returns>
    public async Task<bool> CheckDatabaseIsReachableAsync()
    {
        const string sql = "SELECT 1;";

        using (SqlConnection connection = await OpenConnectionAsync())
        {
            return await connection.QueryFirstOrDefaultAsync<byte>(sql) == 1;
        }
    }

    /// <summary>
    /// Opens and returns a new SQL Db Connection by the Connection String.
    /// </summary>
    /// <returns>A new Sql Connection from the connection pool.</returns>
    protected async Task<SqlConnection> OpenConnectionAsync()
    {
        SqlConnection connection = new(_connectionString);
        await connection.OpenAsync();
        return connection;
    }
}
