using System.Data;
using Dapper;
using DQRetro.TournamentTracker.Api.Models.Configuration;
using DQRetro.TournamentTracker.Api.Models.Jobs;
using DQRetro.TournamentTracker.Api.Persistence.Database.Interfaces;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Options;

namespace DQRetro.TournamentTracker.Api.Persistence.Database;

/// <summary>
/// Concrete implementation of SQL Job Repository.
/// </summary>
public sealed class JobSqlRepository : BaseSqlRepository, IJobSqlRepository
{
    /// <summary>
    /// Ctor.
    /// </summary>
    /// <param name="keyOptions">KeyOptions containing the SQL connection string.</param>
    public JobSqlRepository(IOptions<KeysConfiguration> keyOptions) : base(keyOptions) { }

    /// <inheritdoc />
    public async Task DeleteOldJobExecutionLogsAsync()
    {
        const string procName = "dbo.DeleteOldJobExecutionLogs";

        using (SqlConnection connection = await OpenConnectionAsync())
        {
            await connection.ExecuteAsync(procName, commandType: CommandType.StoredProcedure);
        }
    }

    /// <inheritdoc />
    public async Task<IEnumerable<EnabledJob>> GetEnabledJobsAsync()
    {
        const string procName = "dbo.GetEnabledJobs";

        using (SqlConnection connection = await OpenConnectionAsync())
        {
            return await connection.QueryAsync<EnabledJob>(procName, commandType: CommandType.StoredProcedure);
        }
    }

    /// <inheritdoc />
    public async Task<UpdatedJobDetails> GetJobDetailsByIdAsync(byte jobId)
    {
        const string procName = "dbo.GetJobDetailsById";

        using (SqlConnection connection = await OpenConnectionAsync())
        {
            DynamicParameters parameters = new();
            parameters.Add("@JobId", jobId);

            return await connection.QueryFirstAsync<UpdatedJobDetails>(procName, parameters, commandType: CommandType.StoredProcedure);
        }
    }

    /// <inheritdoc />
    public async Task<int> LogJobExecutionStartedAsync(byte jobId)
    {
        const string procName = "dbo.LogJobStarted";

        using (SqlConnection connection = await OpenConnectionAsync())
        {
            DynamicParameters parameters = new();
            parameters.Add("@JobId", jobId);

            return await connection.QueryFirstAsync<int>(procName, parameters, commandType: CommandType.StoredProcedure);
        }
    }

    /// <inheritdoc />
    public async Task LogJobExecutionEndedAsync(int jobExecutionLogId, string exception)
    {
        const string procName = "dbo.LogJobEnded";

        using (SqlConnection connection = await OpenConnectionAsync())
        {
            DynamicParameters parameters = new();
            parameters.Add("@JobExecutionLogId", jobExecutionLogId);
            parameters.Add("@Exception", exception);

            await connection.ExecuteAsync(procName, parameters, commandType: CommandType.StoredProcedure);
        }
    }
}
