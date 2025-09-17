CREATE TABLE [dbo].[VideoGameCharacterMap] (
    [Id]                 SMALLINT IDENTITY (1, 1) NOT NULL,
    [VideoGameId]        TINYINT  NOT NULL,
    [CharacterId]        SMALLINT NOT NULL,
    [StartGgCharacterId] INT      NULL,
    CONSTRAINT [PK_VideoGameCharacterMap] PRIMARY KEY CLUSTERED ([Id] ASC)
);


GO
GRANT DELETE
    ON OBJECT::[dbo].[VideoGameCharacterMap] TO [TournamentTracker]
    AS [dbo];


GO
GRANT INSERT
    ON OBJECT::[dbo].[VideoGameCharacterMap] TO [TournamentTracker]
    AS [dbo];


GO
GRANT SELECT
    ON OBJECT::[dbo].[VideoGameCharacterMap] TO [TournamentTracker]
    AS [dbo];


GO
GRANT UPDATE
    ON OBJECT::[dbo].[VideoGameCharacterMap] TO [TournamentTracker]
    AS [dbo];

