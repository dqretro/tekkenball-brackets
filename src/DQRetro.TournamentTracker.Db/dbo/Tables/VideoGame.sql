CREATE TABLE [dbo].[VideoGame] (
    [Id]                       TINYINT       IDENTITY (1, 1) NOT NULL,
    [StartGgVideoGameId]       INT           NOT NULL,
    [StartGgLastUpdatedUtc]    DATETIME      NOT NULL,
    [Name]                     NVARCHAR (64) NOT NULL,
    [DisplayName]              NVARCHAR (64) NOT NULL,
    [ReleaseDate]              DATETIME      NOT NULL,
    [RequiresDatePartitioning] BIT           NOT NULL,
    CONSTRAINT [PK_VideoGame] PRIMARY KEY CLUSTERED ([Id] ASC)
);


GO
GRANT DELETE
    ON OBJECT::[dbo].[VideoGame] TO [TournamentTracker]
    AS [dbo];


GO
GRANT INSERT
    ON OBJECT::[dbo].[VideoGame] TO [TournamentTracker]
    AS [dbo];


GO
GRANT SELECT
    ON OBJECT::[dbo].[VideoGame] TO [TournamentTracker]
    AS [dbo];


GO
GRANT UPDATE
    ON OBJECT::[dbo].[VideoGame] TO [TournamentTracker]
    AS [dbo];

