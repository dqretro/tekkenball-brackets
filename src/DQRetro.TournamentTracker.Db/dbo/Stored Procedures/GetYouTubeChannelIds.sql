CREATE PROCEDURE GetYouTubeChannelIds
AS
BEGIN
    SET NOCOUNT ON;

    SELECT [YouTubeChannelId]
      FROM dbo.[VideoChannel];
END
GO
GRANT EXECUTE
    ON OBJECT::[dbo].[GetYouTubeChannelIds] TO [TournamentTracker]
    AS [dbo];
