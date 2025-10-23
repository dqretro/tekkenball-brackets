namespace DQRetro.TournamentTracker.Api.Models.Jobs;

/// <summary>
/// Model representing the response from the GetJobDetailsById stored procedure.
/// </summary>
public sealed class UpdatedJobDetails
{
    /// <summary>
    /// Whether the current job is still enabled.
    /// </summary>
    public bool IsEnabled { get; set; }

    /// <summary>
    /// The updated CronSchedule, dictating how frequently the job will run.
    /// </summary>
    public string CronSchedule { get; set; }
}
