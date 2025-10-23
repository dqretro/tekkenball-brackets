namespace DQRetro.TournamentTracker.Api.Models.Jobs;

/// <summary>
/// Model representing the response from the GetEnabledJobs stored procedure.
/// </summary>
public sealed class EnabledJob
{
    /// <summary>
    /// The Job Id (PK) on the Job table.
    /// </summary>
    public byte Id { get; set; }

    /// <summary>
    /// The name of the Job.
    /// </summary>
    public string Name { get; set; }

    /// <summary>
    /// The CronSchedule, dictating how frequently the job will run.
    /// </summary>
    public string CronSchedule { get; set; }

    /// <summary>
    /// The DateTime in Utc when the last job run occurred,
    /// or null if the job hasn't run for the first time.
    /// </summary>
    public DateTime? LatestJobExecution { get; set; }
}
