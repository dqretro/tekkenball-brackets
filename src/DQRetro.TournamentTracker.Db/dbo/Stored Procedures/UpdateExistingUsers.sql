CREATE PROCEDURE [dbo].[UpdateExistingUsers]
    @UserPlayerTvp dbo.UserPlayerUpsertTvp READONLY
AS
BEGIN
    SET NOCOUNT ON;

    -- If there are any new sponsor/prefixes that don't already exist, then insert them:
    EXEC dbo.InsertNewUserSponsorPrefixes @UserPlayerTvp = @UserPlayerTvp;

    -- Update the UpdatedAtUtc value to now, and update the UserPlayer table with the tvp contents.
    -- The tvp will already have been filtered, so we're only updating users whose data has actually changed.
    DECLARE @NewUpdatedAtUtc DATETIME = GETUTCDATE();

    UPDATE up
       SET up.[PlayerId]        = upt.[PlayerId]
         , up.[Slug]            = upt.[Slug]
         , up.[SponsorPrefixId] = sp.[Id]
         , up.[Name]            = upt.[Name]
         , up.[GamerTag]        = upt.[GamerTag]
         , up.[DiscordUsername] = upt.[DiscordUsername]
         , up.[TwitchUsername]  = upt.[TwitchUsername]
         , up.[TwitterUsername] = upt.[TwitterUsername]
         , up.[UpdatedAtUtc]    = @NewUpdatedAtUtc
      FROM dbo.UserPlayer up
      JOIN @UserPlayerTvp upt
        ON up.[UserId] = upt.[UserId]
      LEFT JOIN dbo.SponsorPrefix sp
        ON upt.[SponsorPrefixName] = sp.[Name]
END

GO
GRANT EXECUTE
    ON OBJECT::[dbo].[UpdateExistingUsers] TO [TournamentTracker]
    AS [dbo];

