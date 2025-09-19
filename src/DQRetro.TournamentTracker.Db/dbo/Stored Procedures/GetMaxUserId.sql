CREATE PROCEDURE [dbo].[GetMaxUserId]
AS
BEGIN
    SET NOCOUNT ON;

    SELECT MAX([UserId])
      FROM dbo.UserPlayer;
END

GO
GRANT EXECUTE
    ON OBJECT::[dbo].[GetMaxUserId] TO [TournamentTracker]
    AS [dbo];

