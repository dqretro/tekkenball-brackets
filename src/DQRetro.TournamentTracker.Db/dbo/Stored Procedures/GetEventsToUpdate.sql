CREATE PROCEDURE [dbo].[GetEventsToUpdate]
    @EventIdsToCheckCsv VARCHAR(8000)
AS
BEGIN
    SET NOCOUNT ON;

    -- I'm purposefully skipping the scenario of 'Event is already excluded', as this
    -- stored procedure is only concerned with events that we should update/check for updates for.
    ; WITH EventCte AS (
        SELECT [value] AS [EventId]
          FROM STRING_SPLIT(@EventIdsToCheckCsv, ',')
    )
	
    -- This query only targets specific events within tournaments, not fully-excluded tournaments.

    -- Statuses in-use here:
    -- ID | Description
    -- 1  | Event is new, and hasn't been previously pulled or excluded.
    -- 2  | Event already exists and is not excluded, check for updates.
    SELECT eCte.[EventId] AS [Id] -- StartGg ID, not table PK ID.
         , e.[UpdatedAt] AS [UpdatedAt]
         , IIF (e.[Id] IS NULL, 1, 2) AS [Status]
      FROM EventCte eCte
      LEFT JOIN dbo.[Event] e
        ON eCte.[EventId] = e.[StartGgEventId]
     WHERE NOT EXISTS (
        SELECT TOP 1 1
          FROM dbo.ExcludedTournamentEvent e
         WHERE eCte.[EventId] = e.[StartGgEventId]
     );
END

GO
GRANT EXECUTE
    ON OBJECT::[dbo].[GetEventsToUpdate] TO [TournamentTracker]
    AS [dbo];

