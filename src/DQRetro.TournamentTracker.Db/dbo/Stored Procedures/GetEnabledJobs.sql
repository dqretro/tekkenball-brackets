CREATE PROCEDURE GetEnabledJobs
AS
BEGIN
    SET NOCOUNT ON;

    -- The intention here is that the application code can check if a job execution is required based off the 
    -- datetime of the last run attempt (assuming it's enabled).

    -- Need to LEFT JOIN the CTE to the Job table, as this won't return anything on the first execution.
    ; WITH LatestJobExecutionsCte AS (
        SELECT MAX([StartedAtUtc]) AS [LatestJobExecution]
             , [JobId]
          FROM dbo.JobExecutionLog
         GROUP BY [JobId]
    )

    SELECT j.[Id]
         , j.[Name]
         , j.[CronSchedule]
         , ljec.[LatestJobExecution]
      FROM dbo.Job j
      LEFT JOIN LatestJobExecutionsCte ljec
        ON j.[Id] = ljec.[JobId]
     WHERE j.[IsEnabled] = 1;
END

GO
GRANT EXECUTE
    ON OBJECT::[dbo].[GetEnabledJobs] TO [TournamentTracker]
    AS [dbo];
