CREATE PROCEDURE GetYouTubeChannels
AS
BEGIN
    SET NOCOUNT ON;

    SELECT [Id]
         , [YouTubeChannelId]
      FROM dbo.[VideoChannel];
END
GO
GRANT EXECUTE
    ON OBJECT::[dbo].[GetYouTubeChannels] TO [TournamentTracker]
    AS [dbo];
