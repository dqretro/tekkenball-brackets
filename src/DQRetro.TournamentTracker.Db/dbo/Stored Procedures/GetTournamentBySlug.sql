CREATE PROCEDURE [dbo].[GetTournamentBySlug]
    @Slug NVARCHAR(64)
AS
BEGIN
    SET NOCOUNT ON;

    SELECT TOP 1 t.[Id]
               , t.[StartGgTournamentId]
               , t.[Name] AS [TournamentName]
               , t.[AttendeeCount]
               , t.[TimeZone]
               , t.[CreatedAt]
               , t.[UpdatedAt]
               , t.[StartsAt]
               , t.[EndsAt]
               , t.[RegistrationOpenAt]
               , t.[RegistrationClosedAt]
               , t.[Status] AS [TournamentStatus]
               , sp.[Name] AS [TournamentOwnerSponsorPrefixName]
               , up.[Name] AS [TournamentOwnerName]
               , up.[GamerTag] AS [TournamentOwnerGamerTag]
               , up.[UserId] AS [TournamentOwnerStartGgUserId]
               , up.[PlayerId] AS [TournamentOwnerStartGgPlayerId]
               , up.[DiscordUsername] AS [TournamentOwnerDiscordUsername]
               , up.[TwitchUsername] AS [TournamentOwnerTwitchUsername]
               , up.[TwitterUsername] AS [TournamentOwnerTwitterUsername]
               , IIF(v.[Id] IS NOT NULL, 1, 0) AS [IsOffline]
               , v.[CountryCode] AS [VenueCountryCode]
               , v.[State] AS [VenueState]
               , v.[City] AS [VenueCity]
               , v.[VenueAddress]
               , v.[VenueName]
               , v.[PostCode] AS [VenuePostCode]
      FROM dbo.[Tournament] t
      JOIN dbo.[UserPlayer] up
        ON t.[OwnerUserPlayerId] = up.[Id]
      LEFT JOIN dbo.[SponsorPrefix] sp
        ON up.[SponsorPrefixId] = sp.[Id]
      LEFT JOIN dbo.[Venue] v
        ON t.[VenueId] = v.[Id]
     WHERE [StartGgSlug] = @Slug;
END

GO
GRANT EXECUTE
    ON OBJECT::[dbo].[GetTournamentBySlug] TO [TournamentTracker]
    AS [dbo];

