-- This current migration assumes that the database has been created, and that a TournamentTracker user has already been created.
-- As this migration will be executed as same user that will be connecting to the DB from the API, the database and login cannot be created here.

-- Start of inserting data:
--      Adding ArmorKing to Tekken 8:
-- TODO: StartGg doesn't currently have a character for 'ArmorKing', and I want to avoid setting this to King.
-- This should be updated from NULL, when ArmorKing is added within StartGg.
INSERT INTO [dbo].[VideoGameCharacterMap] ([VideoGameId], [CharacterId], [StartGgCharacterId])
SELECT TOP 1 vg.[Id] AS [VideoGameId]
           , c.[Id]  AS [CharacterId]
           , NULL    AS [StartGgCharacterId]
  FROM [dbo].[Character] c
 CROSS JOIN [dbo].[VideoGame] vg
 WHERE c.[Name] = 'Armor King'
   AND vg.[Name] = 'TEKKEN 8';
GO
-- End of inserting starter data.


-- Start of removing [Name] column from UserPlayer:
--      Start of dropping the UDT and stored procedures with references to either the UserPlayer [Name] column, or the UserPlayer UDT:
DROP PROCEDURE [dbo].[GetTournamentBySlug];
GO
DROP PROCEDURE [dbo].[GetUserPlayersToUpdate];
GO
DROP PROCEDURE [dbo].[InsertAndGetUsers];
GO
DROP PROCEDURE [dbo].[UpdateExistingUsers];
GO
DROP PROCEDURE [dbo].[InsertNewUserSponsorPrefixes];
GO
DROP TYPE [dbo].[UserPlayerUpsertTvp];
GO
--      End of dropping the UDP and stored procedures.


--      Start of altering the UserPlayer table to remove the [Name] column:
ALTER TABLE [dbo].[UserPlayer]
DROP COLUMN [Name];
GO
--      End of altering the UserPlayer table.


--      Re-create the UserPlayerUpsertTvp UDT without the [Name] column:
CREATE TYPE [dbo].[UserPlayerUpsertTvp] AS TABLE ([UserId]            INT           NOT NULL,
                                                  [PlayerId]          INT           NOT NULL,
                                                  [Slug]              NVARCHAR (64) NOT NULL,
                                                  [SponsorPrefixName] VARCHAR (15)  NULL,
                                                  [GamerTag]          NVARCHAR (25) NOT NULL,
                                                  [DiscordUsername]   NVARCHAR (32) NULL,
                                                  [TwitchUsername]    NVARCHAR (25) NULL,
                                                  [TwitterUsername]   NVARCHAR (15) NULL,
                                                  PRIMARY KEY CLUSTERED ([UserId] ASC));
GO
GRANT EXECUTE
    ON TYPE::[dbo].[UserPlayerUpsertTvp] TO [TournamentTracker];
GO
GRANT REFERENCES
    ON TYPE::[dbo].[UserPlayerUpsertTvp] TO [TournamentTracker];
GO
--      End of re-creating the UDT.


--      Start of re-creating existing stored procedures to remove references to the UserPlayer [Name] column, or the UserPlayer UDT:
--           Remove up.Name reference from GetTournamentBySlug:
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
    ON OBJECT::[dbo].[GetTournamentBySlug] TO [TournamentTracker];
GO

--           Remove up.Name reference from GetUserPlayersToUpdate:
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
    ON OBJECT::[dbo].[GetUserPlayersToUpdate] TO [TournamentTracker];
GO

--           InsertNewUserSponsorPrefixes doesn't explicitly reference up.[Name], but the required TVP does, and this needs to be dropped and re-created:
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
    ON OBJECT::[dbo].[InsertNewUserSponsorPrefixes] TO [TournamentTracker];
GO

--           Remove upt.Name and up.Name references from InsertAndGetUsers:
CREATE PROCEDURE [dbo].[InsertAndGetUsers]
    @UserPlayerTvp dbo.UserPlayerUpsertTvp READONLY
AS
BEGIN
    SET NOCOUNT ON;

    -- If there are any new sponsor/prefixes that don't already exist, then insert them:
    EXEC dbo.InsertNewUserSponsorPrefixes @UserPlayerTvp = @UserPlayerTvp;

    -- Insert any users that don't already exist (after retrieving the correct sponsor/prefix (if applicable)):
    INSERT INTO dbo.UserPlayer ([UserId], [PlayerId], [Slug], [SponsorPrefixId], [GamerTag], [DiscordUsername], [TwitchUsername], [TwitterUsername])
    SELECT upt.[UserId]
         , upt.[PlayerId]
         , upt.[Slug]
         , sp.[Id] AS [SponsorPrefixId]
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
    ON OBJECT::[dbo].[InsertAndGetUsers] TO [TournamentTracker];
GO

--           Remove up.Name reference from UpdateExistingUsers:
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
         , up.[GamerTag]        = upt.[GamerTag]
         , up.[DiscordUsername] = upt.[DiscordUsername]
         , up.[TwitchUsername]  = upt.[TwitchUsername]
         , up.[TwitterUsername] = upt.[TwitterUsername]
         , up.[UpdatedAtUtc]    = @NewUpdatedAtUtc
      FROM dbo.UserPlayer up
      JOIN @UserPlayerTvp upt
        ON up.[UserId] = upt.[UserId]
      LEFT JOIN dbo.SponsorPrefix sp
        ON upt.[SponsorPrefixName] = sp.[Name];
END
GO
GRANT EXECUTE
    ON OBJECT::[dbo].[UpdateExistingUsers] TO [TournamentTracker];
GO
--      End of re-creating existing stored procedures.
-- End of removing [Name] column from UserPlayer.
