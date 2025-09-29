CREATE TYPE [dbo].[EventVideoUpsertTvp] AS TABLE ([VideoChannelId]      SMALLINT      NOT NULL,
                                                  [Title]               NVARCHAR(128) NOT NULL,
                                                  [YouTubeVideoId]      VARCHAR(16)   NOT NULL,
                                                  [YouTubeVideoUrl]     VARCHAR(256)  NOT NULL,
                                                  [YouTubeThumbnailUrl] VARCHAR(256)  NOT NULL,
                                                  PRIMARY KEY CLUSTERED ([YouTubeVideoId]));

GO
GRANT EXECUTE
    ON TYPE::[dbo].[EventVideoUpsertTvp] TO [TournamentTracker];
GO
GRANT REFERENCES
    ON TYPE::[dbo].[EventVideoUpsertTvp] TO [TournamentTracker];
GO
