CREATE PROCEDURE [dbo].[GetVideoGamesToUpdate]
AS
BEGIN
    SET NOCOUNT ON;

    SELECT [Id]
         , [StartGgVideoGameId]
         , [StartGgLastUpdatedUtc]
         , [Name]
         , [RequiresDatePartitioning]
      FROM dbo.VideoGame;
END

GO
GRANT EXECUTE
    ON OBJECT::[dbo].[GetVideoGamesToUpdate] TO [TournamentTracker]
    AS [dbo];

