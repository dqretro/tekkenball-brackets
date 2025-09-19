CREATE PROCEDURE [dbo].[CheckIfEventVideoExists]
    @YouTubeVideoId VARCHAR(16)
AS
BEGIN
    SET NOCOUNT ON;

    SELECT TOP 1 1
      FROM dbo.EventVideo
     WHERE [YouTubeVideoId] = @YouTubeVideoId;
END
GO
GRANT EXECUTE
    ON OBJECT::[dbo].[CheckIfEventVideoExists] TO [TournamentTracker]
    AS [dbo];
