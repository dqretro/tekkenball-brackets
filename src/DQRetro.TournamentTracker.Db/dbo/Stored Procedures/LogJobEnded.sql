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
    ON OBJECT::[dbo].[LogJobEnded] TO [TournamentTracker]
    AS [dbo];
