CREATE PROCEDURE [dbo].[GetVideoGameTournamentPartitions]
    @VideoGameId TINYINT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT [RangeStart]
         , [RangeEnd]
      FROM dbo.VideoGameTournamentPartition
     WHERE [VideoGameId] = @VideoGameId;
END

GO
GRANT EXECUTE
    ON OBJECT::[dbo].[GetVideoGameTournamentPartitions] TO [TournamentTracker]
    AS [dbo];

