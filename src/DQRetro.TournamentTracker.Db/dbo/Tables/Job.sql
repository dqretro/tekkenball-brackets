CREATE TABLE [dbo].[Job] (
    [Id]        TINYINT      IDENTITY (1, 1) NOT NULL,
    [Name]      VARCHAR (32) NOT NULL,
    [IsEnabled] BIT          NOT NULL,
    CONSTRAINT [PK_Job] PRIMARY KEY CLUSTERED ([Id] ASC)
);

GO
GRANT DELETE
    ON OBJECT::[dbo].[Job] TO [TournamentTracker]
    AS [dbo];


GO
GRANT INSERT
    ON OBJECT::[dbo].[Job] TO [TournamentTracker]
    AS [dbo];


GO
GRANT SELECT
    ON OBJECT::[dbo].[Job] TO [TournamentTracker]
    AS [dbo];


GO
GRANT UPDATE
    ON OBJECT::[dbo].[Job] TO [TournamentTracker]
    AS [dbo];
