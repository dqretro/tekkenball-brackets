CREATE TABLE [dbo].[EventVideo] (
    [Id]                  SMALLINT      IDENTITY (1, 1) NOT NULL,
    [VideoChannelId]      SMALLINT                      NOT NULL,
    [EventId]             SMALLINT                          NULL,
    [Title]               NVARCHAR(128)                 NOT NULL,
    [YouTubeVideoId]      VARCHAR(16)                   NOT NULL,
    [YouTubeVideoUrl]     VARCHAR(256)                  NOT NULL,
    [YouTubeThumbnailUrl] VARCHAR(256)                  NOT NULL,
    [ReleaseDate]         DATETIME                          NULL,
    [ExcludedOn]          DATETIME                          NULL, 
    CONSTRAINT [PK_EventVideo] PRIMARY KEY CLUSTERED ([Id] ASC)
);


GO
GRANT DELETE
    ON OBJECT::[dbo].[EventVideo] TO [TournamentTracker]
    AS [dbo];


GO
GRANT INSERT
    ON OBJECT::[dbo].[EventVideo] TO [TournamentTracker]
    AS [dbo];


GO
GRANT SELECT
    ON OBJECT::[dbo].[EventVideo] TO [TournamentTracker]
    AS [dbo];


GO
GRANT UPDATE
    ON OBJECT::[dbo].[EventVideo] TO [TournamentTracker]
    AS [dbo];

