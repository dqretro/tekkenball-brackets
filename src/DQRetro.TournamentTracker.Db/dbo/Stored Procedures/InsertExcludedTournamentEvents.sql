CREATE PROCEDURE [dbo].[InsertExcludedTournamentEvents]
    @ExcludedTournamentEventTvp dbo.ExcludedTournamentEventTvp READONLY
AS
BEGIN
    SET NOCOUNT ON;

    INSERT INTO dbo.ExcludedTournamentEvent ([StartGgTournamentId], [StartGgEventId], [ExclusionReason], [ExcludedOn])
    SELECT [StartGgTournamentId]
         , [StartGgEventId]
         , [ExclusionReason]
         , [ExcludedOn]
      FROM @ExcludedTournamentEventTvp;
END

GO
GRANT EXECUTE
    ON OBJECT::[dbo].[InsertExcludedTournamentEvents] TO [TournamentTracker]
    AS [dbo];

