CREATE PROCEDURE InsertStartGgRequestLogEntry
    @Method VARCHAR(64)
  , @RequestJson NVARCHAR(MAX)
  , @ResponseJson NVARCHAR(MAX)
  , @HttpStatusCode SMALLINT
AS
BEGIN
    SET NOCOUNT ON;

    INSERT INTO dbo.StartGgRequestLog ([Method], [RequestDateTimeUtc], [StartGgRequestJson], [StartGgResponseJson], [HttpStatusCode])
                               VALUES (@Method, GETDATE(), @RequestJson, @ResponseJson, @HttpStatusCode);
END

GO
GRANT EXECUTE
    ON OBJECT::[dbo].[InsertStartGgRequestLogEntry] TO [TournamentTracker]
    AS [dbo];

