-- This current migration assumes that the database has been created, and that a TournamentTracker user has already been created.
-- As this migration will be executed as same user that will be connecting to the DB from the API, the database and login cannot be created here.

-- Start of altering existing tables:
--      Add CronSchedule column to the Job table (table is empty at this stage, so no default values and NOT NULL is acceptable here):
ALTER TABLE [dbo].[Job]
ADD CronSchedule VARCHAR(32) NOT NULL;
GO
--      Set EndedAtUtc column within JobExecutionLog to nullable:
ALTER TABLE [dbo].[JobExecutionLog]
ALTER COLUMN EndedAtUtc DATETIME NULL;
GO
-- End of altering existing tables.


-- Start of creating required stored procedures:
--      DeleteOldJobExecutionLogs:
CREATE PROCEDURE DeleteOldJobExecutionLogs
AS
BEGIN
    SET NOCOUNT ON;

    -- I'm currently opting to delete logs over 1 month old, though the frequency can be changed here.
    -- Ideally, this should be called daily/every few days to make the deletion batches smaller, thus reducing load during deletes.
    DECLARE @OldestAllowedLogUtc DATETIME = DATEADD(MONTH, -1, GETUTCDATE());

    DELETE
      FROM dbo.JobExecutionLog
     WHERE [StartedAtUtc] < @OldestAllowedLogUtc;
END
GO
GRANT EXECUTE
    ON OBJECT::[dbo].[DeleteOldJobExecutionLogs] TO [TournamentTracker];
GO

--      GetEnabledJobs:
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
    ON OBJECT::[dbo].[GetEnabledJobs] TO [TournamentTracker];
GO

--      GetJobDetailsById:
CREATE PROCEDURE GetJobDetailsById
    @JobId TINYINT
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
    ON OBJECT::[dbo].[GetJobDetailsById] TO [TournamentTracker];
GO

--      LogJobStarted:
CREATE PROCEDURE LogJobStarted
    @JobId TINYINT
AS
BEGIN
    SET NOCOUNT ON;

    -- The intention behind this stored procedure is that I want to ensure we always store when a Job has started, regardless of whether a fault prevents
    -- [dbo].[LogJobEnded] from being called, as the API logs can then be investigated.
    -- The inserted ID will be used when calling [dbo].[LogJobEnded].
    INSERT INTO [dbo].[JobExecutionLog] ([JobId], [StartedAtUtc], [EndedAtUtc], [Exception])
    OUTPUT INSERTED.[Id]
    VALUES                              (@JobId,  GETUTCDATE(),   NULL,         NULL);
END
GO
GRANT EXECUTE
    ON OBJECT::[dbo].[LogJobStarted] TO [TournamentTracker];
GO

--      LogJobEnded:
CREATE PROCEDURE LogJobEnded
    @JobExecutionLogId INT
  , @Exception VARCHAR(2048)
AS
BEGIN
    SET NOCOUNT ON;

    -- The intention behind this stored procedure is to log the completion of a Job Execution.
    -- [dbo].[LogJobEnded] should be called after [dbo].[LogJobStarted].
    UPDATE dbo.JobExecutionLog
       SET [EndedAtUtc] = GETUTCDATE()
         , [Exception] = @Exception
     WHERE [Id] = @JobExecutionLogId;
END
GO
GRANT EXECUTE
    ON OBJECT::[dbo].[LogJobEnded] TO [TournamentTracker];
GO
-- End of creating required stored procedures.


-- Start of inserting data:
--      Set Tekken 8 Armor King StartGgCharacterId value to 2804:
UPDATE vgcm
   SET vgcm.[StartGgCharacterId] = 2804
  FROM [dbo].[VideoGameCharacterMap] vgcm
 WHERE EXISTS (
    SELECT TOP 1 1
      FROM [dbo].[VideoGame] vg
     WHERE vg.[Id] = vgcm.[VideoGameId]
       AND vg.[Name] = 'TEKKEN 8'
 ) AND EXISTS (
    SELECT TOP 1 1
      FROM [dbo].[Character] c
     WHERE c.[Id] = vgcm.[CharacterId]
       AND c.[Name] = 'Armor King'
 );

--      Adding ArmorKing to Tekken 8:
-- TODO: StartGg doesn't currently have a character for 'ArmorKing', and I want to avoid setting this to King.
-- This should be updated from NULL, when ArmorKing is added within StartGg.
INSERT INTO [dbo].[VideoGameCharacterMap] ([VideoGameId], [CharacterId], [StartGgCharacterId])
SELECT TOP 1 vg.[Id] AS [VideoGameId]
           , c.[Id]  AS [CharacterId]
           , NULL    AS [StartGgCharacterId]
FROM [dbo].[Character] c
         CROSS JOIN [dbo].[VideoGame] vg
WHERE c.[Name] = 'Armor King'
  AND vg.[Name] = 'TEKKEN 8';
GO
-- End of inserting starter data.
