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
    ON OBJECT::[dbo].[LogJobStarted] TO [TournamentTracker]
    AS [dbo];
