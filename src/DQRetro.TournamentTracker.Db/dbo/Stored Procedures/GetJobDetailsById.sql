CREATE PROCEDURE GetJobDetailsById
AS
BEGIN
    SET NOCOUNT ON;

    -- The intention behind this stored procedures is that the GetEnabledJobs should be used for starting jobs within the API,
    -- but if the CronSchedule or IsEnabled (or any other relevant columns) change, then the application will have stale data.
    -- Therefore, after waiting for the next iteration, we should ensure that the job is still enabled, and that the CronSchedule is still correct.
    SELECT TOP 1 [IsEnabled]
               , [CronSchedule]
      FROM dbo.Job
     WHERE [Id] = @JobId;
END

GO
GRANT EXECUTE
    ON OBJECT::[dbo].[GetJobDetailsById] TO [TournamentTracker]
    AS [dbo];
