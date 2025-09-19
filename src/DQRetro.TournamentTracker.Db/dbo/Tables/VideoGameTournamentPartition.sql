CREATE TABLE [dbo].[VideoGameTournamentPartition] (
    [Id]          SMALLINT      IDENTITY (1, 1) NOT NULL,
    [VideoGameId] TINYINT       NOT NULL,
    [RangeStart]  DATETIME2 (7) NOT NULL,
    [RangeEnd]    DATETIME2 (7) NOT NULL,
    CONSTRAINT [PK_VideoGameTournamentPartitions] PRIMARY KEY CLUSTERED ([Id] ASC)
);


GO
GRANT DELETE
    ON OBJECT::[dbo].[VideoGameTournamentPartition] TO [TournamentTracker]
    AS [dbo];


GO
GRANT INSERT
    ON OBJECT::[dbo].[VideoGameTournamentPartition] TO [TournamentTracker]
    AS [dbo];


GO
GRANT SELECT
    ON OBJECT::[dbo].[VideoGameTournamentPartition] TO [TournamentTracker]
    AS [dbo];


GO
GRANT UPDATE
    ON OBJECT::[dbo].[VideoGameTournamentPartition] TO [TournamentTracker]
    AS [dbo];

