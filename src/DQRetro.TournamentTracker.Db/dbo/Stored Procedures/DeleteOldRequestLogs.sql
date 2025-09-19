CREATE PROCEDURE DeleteOldRequestLogs
AS
BEGIN
    SET NOCOUNT ON;

    -- I'm currently opting to delete logs over 1 month old, though the frequency can be changed here.
    -- Ideally, this should be called daily/every few days to make the deletion batches smaller, thus reducing load during deletes.
    DECLARE @OldestAllowedLogUtc DATETIME = DATEADD(MONTH, -1, GETUTCDATE());

    DELETE
      FROM dbo.StartGgRequestLog
     WHERE [RequestDateTimeUtc] < @OldestAllowedLogUtc;
END

GO
GRANT EXECUTE
    ON OBJECT::[dbo].[DeleteOldRequestLogs] TO [TournamentTracker]
    AS [dbo];

