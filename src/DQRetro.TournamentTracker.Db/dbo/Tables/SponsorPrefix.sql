CREATE TABLE [dbo].[SponsorPrefix] (
    [Id]   SMALLINT      IDENTITY (1, 1) NOT NULL,
    [Name] NVARCHAR (15) NOT NULL,
    CONSTRAINT [PK_SponsorPrefix] PRIMARY KEY CLUSTERED ([Id] ASC)
);


GO
CREATE UNIQUE NONCLUSTERED INDEX [ix_SponsorPrefix_Id_Inc_Name]
    ON [dbo].[SponsorPrefix]([Id] ASC)
    INCLUDE([Name]);


GO
GRANT DELETE
    ON OBJECT::[dbo].[SponsorPrefix] TO [TournamentTracker]
    AS [dbo];


GO
GRANT INSERT
    ON OBJECT::[dbo].[SponsorPrefix] TO [TournamentTracker]
    AS [dbo];


GO
GRANT SELECT
    ON OBJECT::[dbo].[SponsorPrefix] TO [TournamentTracker]
    AS [dbo];


GO
GRANT UPDATE
    ON OBJECT::[dbo].[SponsorPrefix] TO [TournamentTracker]
    AS [dbo];

