CREATE PROCEDURE [dbo].[InsertAndGetUsers]
    @UserPlayerTvp dbo.UserPlayerUpsertTvp READONLY
AS
BEGIN
    SET NOCOUNT ON;

    -- If there are any new sponsor/prefixes that don't already exist, then insert them:
    EXEC dbo.InsertNewUserSponsorPrefixes @UserPlayerTvp = @UserPlayerTvp;

    -- Insert any users that don't already exist (after retrieving the correct sponsor/prefix (if applicable)):
    INSERT INTO dbo.UserPlayer ([UserId], [PlayerId], [Slug], [SponsorPrefixId], [Name], [GamerTag], [DiscordUsername], [TwitchUsername], [TwitterUsername])
    SELECT upt.[UserId]
         , upt.[PlayerId]
         , upt.[Slug]
         , sp.[Id] AS [SponsorPrefixId]
         , upt.[Name]
         , upt.[GamerTag]
         , upt.[DiscordUsername]
         , upt.[TwitchUsername]
         , upt.[TwitterUsername]
      FROM @UserPlayerTvp upt
      LEFT JOIN dbo.SponsorPrefix sp
        ON upt.[SponsorPrefixName] = sp.[Name]
     WHERE NOT EXISTS (
        SELECT TOP 1 1
          FROM dbo.UserPlayer up
         WHERE up.[UserId] = upt.[UserId]
     );
	
    -- Return the new user details (in reality, the only new column is 'Id' on the UserPlayer table):
    -- Can't just use OUTPUT INSERTED here, as the SponsorPrefixName won't exist.
    SELECT up.[Id]
         , up.[UserId]
         , up.[PlayerId]
         , sp.[Name] AS [SponsorPrefixName]
         , up.[Name]
         , up.[GamerTag]
         , up.[DiscordUserName]
         , up.[TwitchUsername]
         , up.[TwitterUsername]
      FROM dbo.UserPlayer up
      LEFT JOIN dbo.SponsorPrefix sp
        ON up.[SponsorPrefixId] = sp.[Id]
     WHERE EXISTS (
        SELECT TOP 1 1
          FROM @UserPlayerTvp upt
         WHERE up.[UserId] = upt.[UserId]
     );
END

GO
GRANT EXECUTE
    ON OBJECT::[dbo].[InsertAndGetUsers] TO [TournamentTracker]
    AS [dbo];

