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
    ON OBJECT::[dbo].[UpsertEventVideos] TO [TournamentTracker]
    AS [dbo];
