CREATE PROCEDURE InsertEventVideo
    @YouTubeChannelId VARCHAR(32),
    @YouTubeChannelName NVARCHAR(64),
    @EventId SMALLINT,
    @Title NVARCHAR(128),
    @YouTubeVideoId VARCHAR(16),
    @YouTubeVideoUrl VARCHAR(256),
    @YouTubeVideoThumbnailUrl VARCHAR(256),
    @ReleaseDate DATETIME
AS
BEGIN
    SET NOCOUNT ON;

    -- Retrieve the VideoChannelId if the channel already exists,
    -- or create it if it's new:
    DECLARE @VideoChannelId SMALLINT;

    SELECT @VideoChannelId = [Id]
      FROM dbo.VideoChannel
     WHERE [YouTubeChannelId] = @YouTubeChannelId
       AND [Name] = @YouTubeChannelName;

    IF @VideoChannelId IS NULL
        BEGIN
            INSERT INTO dbo.VideoChannel ([YouTubeChannelId], [Name])
            VALUES (@YouTubeChannelId, @YouTubeChannelName);

            SELECT @VideoChannelId = [Id]
              FROM dbo.VideoChannel
             WHERE [YouTubeChannelId] = @YouTubeChannelId
               AND [Name] = @YouTubeChannelName;
        END

    -- Everything should now be ready for inserting the EventVideo:
    INSERT INTO dbo.EventVideo ([VideoChannelId], [EventId], [Title], [YouTubeVideoId], [YouTubeVideoUrl], [YouTubeThumbnailUrl], [ReleaseDate])
    VALUES (@VideoChannelId, @EventId, @Title, @YouTubeVideoId, @YouTubeVideoUrl, @YouTubeVideoThumbnailUrl, @ReleaseDate);
END
GO
GRANT EXECUTE
    ON OBJECT::[dbo].[InsertEventVideo] TO [TournamentTracker]
    AS [dbo];
