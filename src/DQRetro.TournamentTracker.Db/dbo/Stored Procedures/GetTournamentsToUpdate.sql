CREATE PROCEDURE [dbo].[GetTournamentsToUpdate]
    @TournamentIdsToCheckCsv VARCHAR(1000)
AS
BEGIN
    SET NOCOUNT ON;

    -- I'm purposefully skipping the scenario of 'Tournament is already excluded', as this
    -- stored procedure is only concerned with tournaments that we should update/check for updates for.
    ; WITH TournamentCte AS (
        SELECT [value] AS [TournamentId]
          FROM STRING_SPLIT(@TournamentIdsToCheckCsv, ',')
    )
	
    -- This query only targets tournaments, not events at this stage, which is why I'm filtering for ExcludedTournamentEvent IS NULL.
    -- The way I've set this table up is that Tournaments without an EventId means to exclude all events within that tournament.

    -- Statuses in-use here:
    -- ID | Description
    -- 1  | Tournament is new, and hasn't been previously pulled or excluded.
    -- 2  | Tournament already exists and is not excluded, check for updates.
    SELECT tCte.[TournamentId] AS [Id] -- StartGg ID, not table PK ID.
         , t.[UpdatedAt] AS [UpdatedAt]
         , IIF (t.[Id] IS NULL, 1, 2) AS [Status]
      FROM TournamentCte tCte
      LEFT JOIN dbo.Tournament t
        ON tCte.[TournamentId] = t.[StartGgTournamentId]
     WHERE NOT EXISTS (
        SELECT TOP 1 1
          FROM dbo.ExcludedTournamentEvent e
         WHERE tCte.[TournamentId] = e.[StartGgTournamentId]
           AND e.[StartGgEventId] IS NULL
     );
END

GO
GRANT EXECUTE
    ON OBJECT::[dbo].[GetTournamentsToUpdate] TO [TournamentTracker]
    AS [dbo];

