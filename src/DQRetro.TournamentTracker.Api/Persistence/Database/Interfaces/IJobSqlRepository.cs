using DQRetro.TournamentTracker.Api.Models.Jobs;

namespace DQRetro.TournamentTracker.Api.Persistence.Database.Interfaces;

/// <summary>
/// Signatures for SQL Video Repository implementation.
/// </summary>
public interface IJobSqlRepository
{
    /// <summary>
    /// Performs an incremental cleanup on the JobExecutionLog table.
    /// Configuration for deletion duration is currently handled within the stored procedure.
    /// </summary>
    /// <returns></returns>
    Task DeleteOldJobExecutionLogsAsync();

    /// <summary>
    /// Gets a list of enabled jobs from the Job table, alongside the last execution from JobExecutionLog.
    /// </summary>
    /// <returns>Collection of enabled jobs.</returns>
    Task<IEnumerable<EnabledJob>> GetEnabledJobsAsync();

    /// <summary>
    /// Gets updated information for the requested JobId.
    /// </summary>
    /// <returns>Job information for the requested JobId.</returns>
    Task<UpdatedJobDetails> GetJobDetailsByIdAsync(byte jobId);

    /// <summary>
    /// Inserts a row into JobExecutionLog for the current job run, returning the Id of the inserted Id.
    /// </summary>
    /// <returns>The Id of the inserted row within JobExecutionLog.</returns>
    Task<int> LogJobExecutionStartedAsync(byte jobId);

    /// <summary>
    /// Updates the JobExecutionLog row, setting the EndedAtUtc and Exception values.
    /// </summary>
    /// <returns></returns>
    Task LogJobExecutionEndedAsync(int jobExecutionLogId, DateTime endedAtUtc, string exception);
}
