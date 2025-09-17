CREATE PROCEDURE [dbo].[InsertNewUserSponsorPrefixes]
    @UserPlayerTvp dbo.UserPlayerUpsertTvp READONLY
AS
BEGIN
    SET NOCOUNT ON;

    INSERT INTO dbo.SponsorPrefix ([Name])
    SELECT DISTINCT upt.[SponsorPrefixName]
      FROM @UserPlayerTvp upt
     WHERE upt.[SponsorPrefixName] IS NOT NULL
       AND NOT EXISTS (
        SELECT TOP 1 1
          FROM dbo.SponsorPrefix sp
         WHERE sp.[Name] = upt.[SponsorPrefixName]
    );
END

GO
GRANT EXECUTE
    ON OBJECT::[dbo].[InsertNewUserSponsorPrefixes] TO [TournamentTracker]
    AS [dbo];

