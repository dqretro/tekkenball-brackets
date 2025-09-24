-- This script (Script0002) is dependent on Script0001.

-- Changes in this script:
--  1 - Drop stored procedures that are no longer needed:
--  2 - Add ExcludedOn column to EventVideo.
--  3 - Add UDT Table for EventVideoUpsertTvp.
--  4 - Create a new upsert stored procedure.
--  5 - Alter the GetEventVideos stored procedure to only return results that haven't been excluded.

-- Start of deleting existing stored procedures:
DROP PROCEDURE IF EXISTS dbo.InsertEventVideo;
DROP PROCEDURE IF EXISTS dbo.CheckIfEventVideoExists;
DROP PROCEDURE IF EXISTS dbo.GetYouTubeChannelIds;
-- End of deleting existing stored procedures.

-- Start of table modifications:
--      EventVideo:
ALTER TABLE EventVideo 
    ADD ExcludedOn DATETIME NULL;
GO
-- End of table modifications.

-- Start of creating required user defined types.
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
-- End of creating required user defined types.

-- Start of creating required stored procedures:
--      GetYouTubeChannels:
CREATE PROCEDURE [dbo].[GetYouTubeChannels]
AS
BEGIN
    SET NOCOUNT ON;

    SELECT [Id]
         , [YouTubeChannelId]
    FROM dbo.[VideoChannel];
END
GO
GRANT EXECUTE
    ON OBJECT::[dbo].[GetYouTubeChannels] TO [TournamentTracker];
GO

--      UpsertEventVideos:
CREATE PROCEDURE UpsertEventVideos
    @UpdatedEventVideos dbo.EventVideoUpsertTvp READONLY
AS
BEGIN
    SET NOCOUNT ON;

    -- If any new EventVideos were found, add them.
    -- If any changes were detected to existing EventVideos, update them.
    -- There are a few columns I want to avoid updating here, for the following reasons:
    --  - VideoChannelId (as there's no way for an upload to change to a different channel).
    --  - EventId (as there's currently no way to reliable automatic way to map the videos to events).
    --  - YouTubeVideoId (as this is the column I'm comparing, so it won't change).
    --  - YouTubeVideoUrl (this should be a generic URL containing the YouTubeVideoId, so again, this shouldn't change).
    --  - ReleaseDate (as this cannot be automatically retrieved on the server).
    --  - ExcludedOn (as this should be a deliberate admin action).
    MERGE INTO dbo.EventVideo AS TARGET
    USING @UpdatedEventVideos AS SOURCE
       ON TARGET.[YouTubeVideoId] = SOURCE.[YouTubeVideoId]

    WHEN MATCHED AND (
            TARGET.[Title]               != SOURCE.[Title]
         OR TARGET.[YouTubeThumbnailUrl] != SOURCE.[YouTubeThumbnailUrl]
    )
    THEN
        UPDATE
           SET TARGET.[Title]               = SOURCE.[Title]
             , TARGET.[YouTubeThumbnailUrl] = SOURCE.[YouTubeThumbnailUrl]

    WHEN NOT MATCHED BY TARGET
    THEN
        INSERT ([VideoChannelId]
              , [EventId]
              , [Title]
              , [YouTubeVideoId]
              , [YouTubeVideoUrl]
              , [YouTubeThumbnailUrl]
              , [ReleaseDate]
              , [ExcludedOn])
        VALUES (SOURCE.[VideoChannelId]
              , NULL
              , SOURCE.[Title]
              , SOURCE.[YouTubeVideoId]
              , SOURCE.[YouTubeVideoUrl]
              , SOURCE.[YouTubeThumbnailUrl]
              , NULL
              , NULL)

    OUTPUT $ACTION AS [ActionType]
         , INSERTED.[Title]
         , INSERTED.[YouTubeVideoId];
END
GO
GRANT EXECUTE
    ON OBJECT::[dbo].[UpsertEventVideos] TO [TournamentTracker];
GO
-- End of creating required stored procedures.

-- Start of altering existing stored procedures:
--      GetEventVideos:
ALTER PROCEDURE [dbo].[GetEventVideos]
AS
BEGIN
    SET NOCOUNT ON;

    SELECT ev.[Title]
         , ev.[YouTubeVideoId]
         , ev.[YouTubeVideoUrl]
         , ev.[YouTubeThumbnailUrl]
         , ev.[ReleaseDate]
         , vc.[Name] AS [ChannelName]
         , vc.[YouTubeChannelId] AS [YouTubeChannelId]
         , e.[Name] AS [EventName]
      FROM dbo.EventVideo ev
      LEFT JOIN dbo.VideoChannel vc
        ON ev.[VideoChannelId] = vc.[Id]
      LEFT JOIN dbo.[Event] e
        ON ev.[EventId] = e.[Id]
     WHERE ev.[ExcludedOn] IS NULL;
END

-- End of altering existing stored procedures.
