CREATE TYPE [dbo].[ExcludedTournamentEventTvp] AS TABLE (
    [StartGgTournamentId] INT      NOT NULL,
    [StartGgEventId]      INT      NOT NULL,
    [ExclusionReason]     TINYINT  NOT NULL,
    [ExcludedOn]          DATETIME NOT NULL);


GO
GRANT REFERENCES
    ON TYPE::[dbo].[ExcludedTournamentEventTvp] TO [TournamentTracker];

