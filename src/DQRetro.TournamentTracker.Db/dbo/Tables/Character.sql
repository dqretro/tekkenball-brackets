CREATE TABLE [dbo].[Character] (
    [Id]              SMALLINT      IDENTITY (1, 1) NOT NULL,
    [Name]            NVARCHAR (64) NOT NULL,
    [AlternativeName] NVARCHAR (64) NULL,
    CONSTRAINT [PK_Character] PRIMARY KEY CLUSTERED ([Id] ASC)
);


GO
GRANT DELETE
    ON OBJECT::[dbo].[Character] TO [TournamentTracker]
    AS [dbo];


GO
GRANT INSERT
    ON OBJECT::[dbo].[Character] TO [TournamentTracker]
    AS [dbo];


GO
GRANT SELECT
    ON OBJECT::[dbo].[Character] TO [TournamentTracker]
    AS [dbo];


GO
GRANT UPDATE
    ON OBJECT::[dbo].[Character] TO [TournamentTracker]
    AS [dbo];

