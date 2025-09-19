CREATE TABLE [dbo].[VideoChannel] (
    [Id]                  SMALLINT      IDENTITY (1, 1) NOT NULL,
    [YouTubeChannelId]    VARCHAR(32)                   NOT NULL,
    [Name]                NVARCHAR(64)                  NOT NULL,
    CONSTRAINT [PK_VideoChannel] PRIMARY KEY CLUSTERED ([Id] ASC)
);


GO
GRANT DELETE
    ON OBJECT::[dbo].[VideoChannel] TO [TournamentTracker]
    AS [dbo];


GO
GRANT INSERT
    ON OBJECT::[dbo].[VideoChannel] TO [TournamentTracker]
    AS [dbo];


GO
GRANT SELECT
    ON OBJECT::[dbo].[VideoChannel] TO [TournamentTracker]
    AS [dbo];


GO
GRANT UPDATE
    ON OBJECT::[dbo].[VideoChannel] TO [TournamentTracker]
    AS [dbo];

