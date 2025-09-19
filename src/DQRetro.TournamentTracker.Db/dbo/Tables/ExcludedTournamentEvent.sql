CREATE TABLE [dbo].[ExcludedTournamentEvent] (
    [Id]                  SMALLINT IDENTITY (1, 1) NOT NULL,
    [StartGgTournamentId] INT      NOT NULL,
    [StartGgEventId]      INT      NULL,
    [ExclusionReason]     TINYINT  NOT NULL,
    [ExcludedOn]          DATETIME NOT NULL,
    CONSTRAINT [PK_ExcludedTournamentEvent] PRIMARY KEY CLUSTERED ([Id] ASC)
);


GO
CREATE NONCLUSTERED INDEX [ix_ExcludedTournamentEvent_StartGgTournamentId]
    ON [dbo].[ExcludedTournamentEvent]([StartGgTournamentId] ASC);


GO
CREATE NONCLUSTERED INDEX [ix_ExcludedTournamentEvent_StartGgEventId]
    ON [dbo].[ExcludedTournamentEvent]([StartGgEventId] ASC);


GO
GRANT DELETE
    ON OBJECT::[dbo].[ExcludedTournamentEvent] TO [TournamentTracker]
    AS [dbo];


GO
GRANT INSERT
    ON OBJECT::[dbo].[ExcludedTournamentEvent] TO [TournamentTracker]
    AS [dbo];


GO
GRANT SELECT
    ON OBJECT::[dbo].[ExcludedTournamentEvent] TO [TournamentTracker]
    AS [dbo];


GO
GRANT UPDATE
    ON OBJECT::[dbo].[ExcludedTournamentEvent] TO [TournamentTracker]
    AS [dbo];

