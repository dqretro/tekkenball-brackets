CREATE PROCEDURE GetEventVideos
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
        ON ev.[EventId] = e.[Id];
END
GO
GRANT EXECUTE
    ON OBJECT::[dbo].[GetEventVideos] TO [TournamentTracker]
    AS [dbo];
