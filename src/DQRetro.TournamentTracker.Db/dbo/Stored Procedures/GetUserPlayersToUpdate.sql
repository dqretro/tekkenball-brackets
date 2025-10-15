CREATE PROCEDURE [dbo].[GetUserPlayersToUpdate]
    @IdGreaterThan INT
  , @ChunkSize INT
AS
BEGIN
    SET NOCOUNT ON;

    -- I'm currently opting to check for user updates if we haven't checked in the last week,
    -- though the frequency can be changed here. It's expected that users/profiles won't change often.
    DECLARE @OldestAllowedUpdateUtc DATETIME = DATEADD(WEEK, -1, GETUTCDATE());

    SELECT TOP(@ChunkSize) up.[UserId]
                         , up.[PlayerId]
                         , up.[Slug]
                         , up.[GamerTag]
                         , up.[DiscordUsername]
                         , up.[TwitchUsername]
                         , up.[TwitterUsername]
                         , sp.[Name] AS [SponsorPrefixName]
      FROM dbo.UserPlayer up
      LEFT JOIN dbo.SponsorPrefix sp
        ON up.[SponsorPrefixId] = sp.[Id]
     WHERE up.[UserId] > @IdGreaterThan
       AND up.[ShouldUpdate] = 1
       AND up.[UpdatedAtUtc] < @OldestAllowedUpdateUtc
     ORDER BY up.[UserId] ASC;
END

GO
GRANT EXECUTE
    ON OBJECT::[dbo].[GetUserPlayersToUpdate] TO [TournamentTracker]
    AS [dbo];

