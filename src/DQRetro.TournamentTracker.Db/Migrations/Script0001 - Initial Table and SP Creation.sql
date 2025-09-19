-- This current migration assumes that the database has been created, and that a TournamentTracker user has already been created.
-- As this migration will be executed as same user that will be connecting to the DB from the API, the database and login cannot be created here.

-- Start of creating required tables:

--      Character:
CREATE TABLE [dbo].[Character] ([Id]              SMALLINT      IDENTITY (1, 1) NOT NULL,
                                [Name]            NVARCHAR (64) NOT NULL,
                                [AlternativeName] NVARCHAR (64) NULL,
                                CONSTRAINT [PK_Character] PRIMARY KEY CLUSTERED ([Id] ASC)
);
GO
GRANT DELETE
    ON OBJECT::[dbo].[Character] TO [TournamentTracker]
    AS [dbo];
GO
GRANT INSERT
    ON OBJECT::[dbo].[Character] TO [TournamentTracker]
    AS [dbo];
GO
GRANT SELECT
    ON OBJECT::[dbo].[Character] TO [TournamentTracker]
    AS [dbo];
GO
GRANT UPDATE
    ON OBJECT::[dbo].[Character] TO [TournamentTracker]
    AS [dbo];
GO

--      Event:
CREATE TABLE [dbo].[Event] ([Id]              SMALLINT       NOT NULL,
                            [StartGgEventId]  INT            NOT NULL,
                            [Name]            NVARCHAR (128) NOT NULL,
                            [TournamentId]    SMALLINT       NOT NULL,
                            [VideoGameId]     TINYINT        NOT NULL,
                            [CreatedAt]       DATETIME       NOT NULL,
                            [UpdatedAt]       DATETIME       NOT NULL,
                            [StartsAt]        DATETIME       NOT NULL,
                            [CheckInBuffer]   INT            NULL,
                            [CheckInDuration] INT            NULL,
                            [EntryFee]        DECIMAL (5, 2) NOT NULL,
                            [EntrantsCount]   SMALLINT       NOT NULL,
                            [Status]          TINYINT        NOT NULL,
                            [Type]            TINYINT        NOT NULL,
                            CONSTRAINT [PK_Event] PRIMARY KEY CLUSTERED ([Id] ASC)
);
GO
CREATE UNIQUE NONCLUSTERED INDEX [ix_Event_StartGgTournamentId_Inc_UpdatedAt_Id]
    ON [dbo].[Event]([StartGgEventId] ASC)
    INCLUDE([UpdatedAt], [Id]);
GO
GRANT DELETE
    ON OBJECT::[dbo].[Event] TO [TournamentTracker]
    AS [dbo];
GO
GRANT INSERT
    ON OBJECT::[dbo].[Event] TO [TournamentTracker]
    AS [dbo];
GO
GRANT SELECT
    ON OBJECT::[dbo].[Event] TO [TournamentTracker]
    AS [dbo];
GO
GRANT UPDATE
    ON OBJECT::[dbo].[Event] TO [TournamentTracker]
    AS [dbo];
GO

--      ExcludedTournamentEvent:
CREATE TABLE [dbo].[ExcludedTournamentEvent] ([Id]                  SMALLINT IDENTITY (1, 1) NOT NULL,
                                              [StartGgTournamentId] INT      NOT NULL,
                                              [StartGgEventId]      INT      NULL,
                                              [ExclusionReason]     TINYINT  NOT NULL,
                                              [ExcludedOn]          DATETIME NOT NULL,
                                              CONSTRAINT [PK_ExcludedTournamentEvent] PRIMARY KEY CLUSTERED ([Id] ASC)
);
GO
CREATE NONCLUSTERED INDEX [ix_ExcludedTournamentEvent_StartGgTournamentId]
    ON [dbo].[ExcludedTournamentEvent]([StartGgTournamentId] ASC);
GO
CREATE NONCLUSTERED INDEX [ix_ExcludedTournamentEvent_StartGgEventId]
    ON [dbo].[ExcludedTournamentEvent]([StartGgEventId] ASC);
GO
GRANT DELETE
    ON OBJECT::[dbo].[ExcludedTournamentEvent] TO [TournamentTracker]
    AS [dbo];
GO
GRANT INSERT
    ON OBJECT::[dbo].[ExcludedTournamentEvent] TO [TournamentTracker]
    AS [dbo];
GO
GRANT SELECT
    ON OBJECT::[dbo].[ExcludedTournamentEvent] TO [TournamentTracker]
    AS [dbo];
GO
GRANT UPDATE
    ON OBJECT::[dbo].[ExcludedTournamentEvent] TO [TournamentTracker]
    AS [dbo];
GO

--      Job:
CREATE TABLE [dbo].[Job] ([Id]        TINYINT      IDENTITY (1, 1) NOT NULL,
                          [Name]      VARCHAR (32) NOT NULL,
                          [IsEnabled] BIT          NOT NULL,
                          CONSTRAINT [PK_Job] PRIMARY KEY CLUSTERED ([Id] ASC)
);
GO
GRANT DELETE
    ON OBJECT::[dbo].[Job] TO [TournamentTracker]
    AS [dbo];
GO
GRANT INSERT
    ON OBJECT::[dbo].[Job] TO [TournamentTracker]
    AS [dbo];
GO
GRANT SELECT
    ON OBJECT::[dbo].[Job] TO [TournamentTracker]
    AS [dbo];
GO
GRANT UPDATE
    ON OBJECT::[dbo].[Job] TO [TournamentTracker]
    AS [dbo];
GO

--      JobExecutionLog:
CREATE TABLE [dbo].[JobExecutionLog] ([Id]           INT            IDENTITY (1, 1) NOT NULL,
                                      [JobId]        TINYINT        NOT NULL,
                                      [StartedAtUtc] DATETIME       NOT NULL,
                                      [EndedAtUtc]   DATETIME       NOT NULL,
                                      [Exception]    VARCHAR (2048) NULL,
                                      CONSTRAINT [PK_JobExecutionLog] PRIMARY KEY CLUSTERED ([Id] ASC)
);
GO
GRANT DELETE
    ON OBJECT::[dbo].[JobExecutionLog] TO [TournamentTracker]
    AS [dbo];
GO
GRANT INSERT
    ON OBJECT::[dbo].[JobExecutionLog] TO [TournamentTracker]
    AS [dbo];
GO
GRANT SELECT
    ON OBJECT::[dbo].[JobExecutionLog] TO [TournamentTracker]
    AS [dbo];
GO
GRANT UPDATE
    ON OBJECT::[dbo].[JobExecutionLog] TO [TournamentTracker]
    AS [dbo];
GO

--      SponsorPrefix:
CREATE TABLE [dbo].[SponsorPrefix] ([Id]   SMALLINT      IDENTITY (1, 1) NOT NULL,
                                    [Name] NVARCHAR (15) NOT NULL,
                                    CONSTRAINT [PK_SponsorPrefix] PRIMARY KEY CLUSTERED ([Id] ASC)
);
GO
CREATE UNIQUE NONCLUSTERED INDEX [ix_SponsorPrefix_Id_Inc_Name]
    ON [dbo].[SponsorPrefix]([Id] ASC)
    INCLUDE([Name]);
GO
GRANT DELETE
    ON OBJECT::[dbo].[SponsorPrefix] TO [TournamentTracker]
    AS [dbo];
GO
GRANT INSERT
    ON OBJECT::[dbo].[SponsorPrefix] TO [TournamentTracker]
    AS [dbo];
GO
GRANT SELECT
    ON OBJECT::[dbo].[SponsorPrefix] TO [TournamentTracker]
    AS [dbo];
GO
GRANT UPDATE
    ON OBJECT::[dbo].[SponsorPrefix] TO [TournamentTracker]
    AS [dbo];
GO

--      StartGgRequestLog:
CREATE TABLE [dbo].[StartGgRequestLog] ([Id]                  INT            IDENTITY (1, 1) NOT NULL,
                                        [Method]              VARCHAR (64)   NOT NULL,
                                        [RequestDateTimeUtc]  DATETIME       NOT NULL,
                                        [StartGgRequestJson]  NVARCHAR (MAX) NOT NULL,
                                        [StartGgResponseJson] NVARCHAR (MAX) NOT NULL,
                                        [HttpStatusCode]      SMALLINT       NOT NULL,
                                        CONSTRAINT [PK_StartGgRequestLog] PRIMARY KEY CLUSTERED ([Id] ASC)
);
GO
GRANT DELETE
    ON OBJECT::[dbo].[StartGgRequestLog] TO [TournamentTracker]
    AS [dbo];
GO
GRANT INSERT
    ON OBJECT::[dbo].[StartGgRequestLog] TO [TournamentTracker]
    AS [dbo];
GO
GRANT SELECT
    ON OBJECT::[dbo].[StartGgRequestLog] TO [TournamentTracker]
    AS [dbo];
GO
GRANT UPDATE
    ON OBJECT::[dbo].[StartGgRequestLog] TO [TournamentTracker]
    AS [dbo];
GO

--      Tournament:
CREATE TABLE [dbo].[Tournament] ([Id]                   SMALLINT      IDENTITY (1, 1) NOT NULL,
                                 [StartGgTournamentId]  INT           NOT NULL,
                                 [StartGgSlug]          NVARCHAR (64) NOT NULL,
                                 [Name]                 NVARCHAR (64) NOT NULL,
                                 [AttendeeCount]        SMALLINT      NOT NULL,
                                 [VenueId]              SMALLINT      NULL,
                                 [OwnerUserPlayerId]    SMALLINT      NOT NULL,
                                 [TimeZone]             VARCHAR (32)  NOT NULL,
                                 [CreatedAt]            DATETIME      NOT NULL,
                                 [UpdatedAt]            DATETIME      NOT NULL,
                                 [StartsAt]             DATETIME      NOT NULL,
                                 [EndsAt]               DATETIME      NOT NULL,
                                 [RegistrationOpenAt]   DATETIME      NOT NULL,
                                 [RegistrationClosedAt] DATETIME      NOT NULL,
                                 [Status]               TINYINT       NOT NULL,
                                 CONSTRAINT [PK_Tournament] PRIMARY KEY CLUSTERED ([Id] ASC)
);
GO
CREATE UNIQUE NONCLUSTERED INDEX [ix_Tournament_Slug_GetTournamentBySlug]
    ON [dbo].[Tournament]([StartGgSlug] ASC)
    INCLUDE([Id], [StartGgTournamentId], [Name], [AttendeeCount], [VenueId], [OwnerUserPlayerId], [TimeZone], [CreatedAt], [UpdatedAt], [StartsAt], [EndsAt], [RegistrationOpenAt], [RegistrationClosedAt], [Status]);
GO
CREATE UNIQUE NONCLUSTERED INDEX [ix_Tournament_StartGgTournamentId_Inc_UpdatedAt_Id]
    ON [dbo].[Tournament]([StartGgTournamentId] ASC)
    INCLUDE([UpdatedAt], [Id]);
GO
GRANT DELETE
    ON OBJECT::[dbo].[Tournament] TO [TournamentTracker]
    AS [dbo];
GO
GRANT INSERT
    ON OBJECT::[dbo].[Tournament] TO [TournamentTracker]
    AS [dbo];
GO
GRANT SELECT
    ON OBJECT::[dbo].[Tournament] TO [TournamentTracker]
    AS [dbo];
GO
GRANT UPDATE
    ON OBJECT::[dbo].[Tournament] TO [TournamentTracker]
    AS [dbo];
GO

--      UserPlayer:
CREATE TABLE [dbo].[UserPlayer] ([Id]              SMALLINT      IDENTITY (1, 1) NOT NULL,
                                 [UserId]          INT           NOT NULL,
                                 [PlayerId]        INT           NOT NULL,
                                 [Slug]            NVARCHAR (64) NULL,
                                 [SponsorPrefixId] SMALLINT      NULL,
                                 [Name]            NVARCHAR (64) NULL,
                                 [GamerTag]        NVARCHAR (25) NOT NULL,
                                 [DiscordUsername] NVARCHAR (32) NULL,
                                 [TwitchUsername]  NVARCHAR (25) NULL,
                                 [TwitterUsername] NVARCHAR (15) NULL,
                                 [UpdatedAtUtc]    DATETIME      NOT NULL,
                                 [ShouldUpdate]    BIT           NOT NULL,
                                 CONSTRAINT [PK_UserPlayer] PRIMARY KEY CLUSTERED ([Id] ASC),
                                 CONSTRAINT [FK_UserPlayer_SponsorPrefix_SponsorPrefixId] FOREIGN KEY ([SponsorPrefixId]) REFERENCES [dbo].[SponsorPrefix] ([Id])
);
GO
GRANT DELETE
    ON OBJECT::[dbo].[UserPlayer] TO [TournamentTracker]
    AS [dbo];
GO
GRANT INSERT
    ON OBJECT::[dbo].[UserPlayer] TO [TournamentTracker]
    AS [dbo];
GO
GRANT SELECT
    ON OBJECT::[dbo].[UserPlayer] TO [TournamentTracker]
    AS [dbo];
GO
GRANT UPDATE
    ON OBJECT::[dbo].[UserPlayer] TO [TournamentTracker]
    AS [dbo];
GO

--      Venue:
CREATE TABLE [dbo].[Venue] ([Id]           SMALLINT       IDENTITY (1, 1) NOT NULL,
                            [CountryCode]  VARCHAR (2)    NOT NULL,
                            [State]        NVARCHAR (64)  NOT NULL,
                            [City]         NVARCHAR (64)  NOT NULL,
                            [PostCode]     VARCHAR (10)   NOT NULL,
                            [VenueAddress] NVARCHAR (128) NOT NULL,
                            [VenueName]    NVARCHAR (64)  NULL,
                            [Latitude]     DECIMAL (6, 4) NOT NULL,
                            [Longitude]    DECIMAL (7, 4) NOT NULL,
                            CONSTRAINT [PK_Venue] PRIMARY KEY CLUSTERED ([Id] ASC)
);
GO
GRANT DELETE
    ON OBJECT::[dbo].[Venue] TO [TournamentTracker]
    AS [dbo];
GO
GRANT INSERT
    ON OBJECT::[dbo].[Venue] TO [TournamentTracker]
    AS [dbo];
GO
GRANT SELECT
    ON OBJECT::[dbo].[Venue] TO [TournamentTracker]
    AS [dbo];
GO
GRANT UPDATE
    ON OBJECT::[dbo].[Venue] TO [TournamentTracker]
    AS [dbo];
GO

--      VideoGame:
CREATE TABLE [dbo].[VideoGame] ([Id]                       TINYINT       IDENTITY (1, 1) NOT NULL,
                                [StartGgVideoGameId]       INT           NOT NULL,
                                [StartGgLastUpdatedUtc]    DATETIME      NOT NULL,
                                [Name]                     NVARCHAR (64) NOT NULL,
                                [DisplayName]              NVARCHAR (64) NOT NULL,
                                [ReleaseDate]              DATETIME      NOT NULL,
                                [RequiresDatePartitioning] BIT           NOT NULL,
                                CONSTRAINT [PK_VideoGame] PRIMARY KEY CLUSTERED ([Id] ASC)
);
GO
GRANT DELETE
    ON OBJECT::[dbo].[VideoGame] TO [TournamentTracker]
    AS [dbo];
GO
GRANT INSERT
    ON OBJECT::[dbo].[VideoGame] TO [TournamentTracker]
    AS [dbo];
GO
GRANT SELECT
    ON OBJECT::[dbo].[VideoGame] TO [TournamentTracker]
    AS [dbo];
GO
GRANT UPDATE
    ON OBJECT::[dbo].[VideoGame] TO [TournamentTracker]
    AS [dbo];
GO

--      VideoGameCharacterMap:
CREATE TABLE [dbo].[VideoGameCharacterMap] ([Id]                 SMALLINT IDENTITY (1, 1) NOT NULL,
                                            [VideoGameId]        TINYINT  NOT NULL,
                                            [CharacterId]        SMALLINT NOT NULL,
                                            [StartGgCharacterId] INT      NULL,
                                            CONSTRAINT [PK_VideoGameCharacterMap] PRIMARY KEY CLUSTERED ([Id] ASC)
);
GO
GRANT DELETE
    ON OBJECT::[dbo].[VideoGameCharacterMap] TO [TournamentTracker]
    AS [dbo];
GO
GRANT INSERT
    ON OBJECT::[dbo].[VideoGameCharacterMap] TO [TournamentTracker]
    AS [dbo];
GO
GRANT SELECT
    ON OBJECT::[dbo].[VideoGameCharacterMap] TO [TournamentTracker]
    AS [dbo];
GO
GRANT UPDATE
    ON OBJECT::[dbo].[VideoGameCharacterMap] TO [TournamentTracker]
    AS [dbo];
GO

--      VideoGameTournamentPartition:
CREATE TABLE [dbo].[VideoGameTournamentPartition] ([Id]          SMALLINT      IDENTITY (1, 1) NOT NULL,
                                                   [VideoGameId] TINYINT       NOT NULL,
                                                   [RangeStart]  DATETIME2 (7) NOT NULL,
                                                   [RangeEnd]    DATETIME2 (7) NOT NULL,
                                                   CONSTRAINT [PK_VideoGameTournamentPartitions] PRIMARY KEY CLUSTERED ([Id] ASC)
);
GO
GRANT DELETE
    ON OBJECT::[dbo].[VideoGameTournamentPartition] TO [TournamentTracker]
    AS [dbo];
GO
GRANT INSERT
    ON OBJECT::[dbo].[VideoGameTournamentPartition] TO [TournamentTracker]
    AS [dbo];
GO
GRANT SELECT
    ON OBJECT::[dbo].[VideoGameTournamentPartition] TO [TournamentTracker]
    AS [dbo];
GO
GRANT UPDATE
    ON OBJECT::[dbo].[VideoGameTournamentPartition] TO [TournamentTracker]
    AS [dbo];
GO

-- End of creating required tables.


-- Start of creating required user defined types:

--      ExcludedTournamentEventTvp:
CREATE TYPE [dbo].[ExcludedTournamentEventTvp] AS TABLE ([StartGgTournamentId] INT      NOT NULL,
                                                         [StartGgEventId]      INT      NOT NULL,
                                                         [ExclusionReason]     TINYINT  NOT NULL,
                                                         [ExcludedOn]          DATETIME NOT NULL);
GO
GRANT EXECUTE
    ON TYPE::[dbo].[ExcludedTournamentEventTvp] TO [TournamentTracker];
GO
GRANT REFERENCES
    ON TYPE::[dbo].[ExcludedTournamentEventTvp] TO [TournamentTracker];
GO

--      UserPlayerUpsertTvp:
CREATE TYPE [dbo].[UserPlayerUpsertTvp] AS TABLE ([UserId]            INT           NOT NULL,
                                                  [PlayerId]          INT           NOT NULL,
                                                  [Slug]              NVARCHAR (64) NOT NULL,
                                                  [SponsorPrefixName] VARCHAR (15)  NULL,
                                                  [Name]              NVARCHAR (64) NULL,
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

-- End of creating required user defined types.


-- Start of creating required stored procedures:

--      DeleteOldRequestLogs:
CREATE PROCEDURE DeleteOldRequestLogs
AS
BEGIN
    SET NOCOUNT ON;

    -- I'm currently opting to delete logs over 1 month old, though the frequency can be changed here.
    -- Ideally, this should be called daily/every few days to make the deletion batches smaller, thus reducing load during deletes.
    DECLARE @OldestAllowedLogUtc DATETIME = DATEADD(MONTH, -1, GETUTCDATE());

    DELETE
    FROM dbo.StartGgRequestLog
    WHERE [RequestDateTimeUtc] < @OldestAllowedLogUtc;
END
GO
GRANT EXECUTE
    ON OBJECT::[dbo].[DeleteOldRequestLogs] TO [TournamentTracker]
    AS [dbo];
GO

--      GetEventsToUpdate:
CREATE PROCEDURE [dbo].[GetEventsToUpdate]
    @EventIdsToCheckCsv VARCHAR(8000)
AS
BEGIN
    SET NOCOUNT ON;

    -- I'm purposefully skipping the scenario of 'Event is already excluded', as this
    -- stored procedure is only concerned with events that we should update/check for updates for.
    ; WITH EventCte AS (
        SELECT [value] AS [EventId]
          FROM STRING_SPLIT(@EventIdsToCheckCsv, ',')
    )

      -- This query only targets specific events within tournaments, not fully-excluded tournaments.

      -- Statuses in-use here:
      -- ID | Description
      -- 1  | Event is new, and hasn't been previously pulled or excluded.
      -- 2  | Event already exists and is not excluded, check for updates.
      SELECT eCte.[EventId] AS [Id] -- StartGg ID, not table PK ID.
           , e.[UpdatedAt] AS [UpdatedAt]
           , IIF (e.[Id] IS NULL, 1, 2) AS [Status]
        FROM EventCte eCte
        LEFT JOIN dbo.[Event] e
          ON eCte.[EventId] = e.[StartGgEventId]
       WHERE NOT EXISTS (
          SELECT TOP 1 1
            FROM dbo.ExcludedTournamentEvent e
           WHERE eCte.[EventId] = e.[StartGgEventId]
       );
END
GO
GRANT EXECUTE
    ON OBJECT::[dbo].[GetEventsToUpdate] TO [TournamentTracker]
    AS [dbo];
GO

--      GetHealth:
CREATE PROCEDURE [dbo].[GetHealth]
AS
BEGIN
    SET NOCOUNT ON;

    -- Get table counts (monitor table growth over time, though I don't want to monitor on this at this stage).
    -- I've opted for the NOLOCK table hint here, as the potential for dirty reads aren't problematic here.
    DECLARE @SponsorPrefixTableCount SMALLINT
          , @UserPlayerTableCount INT
          , @VideoGameTableCount TINYINT
          , @VideoGameCharacterMapTableCount SMALLINT
          , @CharacterTableCount SMALLINT;
    
    SELECT @SponsorPrefixTableCount = (SELECT COUNT(*) FROM dbo.SponsorPrefix WITH (NOLOCK))
         , @UserPlayerTableCount = (SELECT COUNT(*) FROM dbo.UserPlayer WITH (NOLOCK))
         , @VideoGameTableCount = (SELECT COUNT(*) FROM dbo.VideoGame WITH (NOLOCK))
         , @VideoGameCharacterMapTableCount = (SELECT COUNT(*) FROM dbo.VideoGameCharacterMap WITH (NOLOCK))
         , @CharacterTableCount = (SELECT COUNT(*) FROM dbo.[Character] WITH (NOLOCK));

    -- Get current and available disk space (using Express edition, so the database can be a max of 10GB).
    -- Available disk space here refers to how far away are we from the 10GB Express edition limit.
    -- It's also an idea to return how much available disk space there is on the server, but this can be retrieved at the application level.
    DECLARE @CurrentDbSizeGb DECIMAL(4, 2)
          , @AvailableDbSizeForEditionGb DECIMAL(4, 2);

    SELECT TOP 1 @CurrentDbSizeGb = SUM(size) * 8.0 / 1024.0 / 1024.0
      FROM sys.master_files
     WHERE database_id = DB_ID()
       AND type_desc = 'ROWS';

    SET @AvailableDbSizeForEditionGb = 10.0 - @CurrentDbSizeGb;

    -- Additional potential health data to implement once the DB starts being used:
    -- Number of active connections from the application to the db.
    -- Number of open transactions from the application to the db.
    -- Number of sleeping SPIDs from the application to the db.
    -- DB CPU Usage.
    -- DB RAM Usage.
    -- Poor Index Usage.
    -- Fragmented Indexes (requiring rebuilds).
    -- Indexes requiring statistics updates.
    -- Missing Indexes.
    -- Long-running queries.
    -- TempDB Usage.
    -- Blocking Sessions.
    -- Amount of Deadlocks.
    -- High CPU/IO Waits.

    -- SP_WHO2 may be useful for obtaining some of the above details.

    -- Return results:
    SELECT SponsorPrefixTableCount = @SponsorPrefixTableCount
         , UserPlayerTableCount = @UserPlayerTableCount
         , VideoGameTableCount = @VideoGameTableCount
         , VideoGameCharacterMapTableCount = @VideoGameCharacterMapTableCount
         , CharacterTableCount = @CharacterTableCount
         , CurrentDbSizeGb = @CurrentDbSizeGb
         , AvailableDbSizeForEditionGb = @AvailableDbSizeForEditionGb;
END
GO
GRANT EXECUTE
    ON OBJECT::[dbo].[GetHealth] TO [TournamentTracker]
    AS [dbo];
GO

--      GetHealthStoredProceduresDuration:
CREATE PROCEDURE GetHealthStoredProceduresDuration
AS
BEGIN
    SET NOCOUNT ON;

    ; WITH RuntimeStats AS (
        SELECT [plan_id] AS [PlanId]
             , MIN([min_duration]) / 1000.0 AS [MinDurationMs]
             , MAX([max_duration]) / 1000.0 AS [MaxDurationMs]
             , AVG([avg_duration]) / 1000.0 AS [AvgDurationMs]
          FROM sys.query_store_runtime_stats
         GROUP BY [plan_id]
    )

    SELECT p.[name] AS [StoredProcedureName]
         , (SELECT CAST(qsqt.[query_sql_text] AS NVARCHAR(MAX)) FOR XML PATH(''), TYPE) AS [SQL]
         , rs.[MinDurationMs]
         , rs.[MaxDurationMs]
         , rs.[AvgDurationMs]
         , qsq.[query_id] AS [QueryId]
         , qsp.[plan_id] AS [PlanId]
         -- The following columns may be useful in future, but aren't needed now:
         -- , qsp.[is_forced_plan]
         -- , qsp.[query_plan_hash]
         -- , qsp.[plan_forcing_type_desc]
         -- , qsp.[query_plan] -- To pop out the query plan in SSMS, replace this with: CAST(qsp.[query_plan] AS XML) AS plan_xml
      FROM sys.query_store_query qsq
      JOIN sys.objects o
        ON qsq.[object_id] = o.[object_id]
      JOIN sys.procedures p
        ON o.[object_id] = p.[object_id]
      JOIN sys.query_store_query_text qsqt
        ON qsq.[query_text_id] = qsqt.[query_text_id]
      JOIN sys.query_store_plan qsp
        ON qsq.[query_id] = qsp.[query_id]
      JOIN RuntimeStats rs
        ON qsp.[plan_id] = rs.[PlanId]
     WHERE p.[name] NOT IN ('GetHealthStoredProceduresDuration') -- Need to be mindful of what's excluded here.
     ORDER BY MaxDurationMs DESC;
END
GO
GRANT EXECUTE
    ON OBJECT::[dbo].[GetHealthStoredProceduresDuration] TO [TournamentTracker]
    AS [dbo];
GO

--      GetMaxUserId:
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
GO

--      GetTournamentBySlug:
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
GO

--      GetTournamentsToUpdate:
CREATE PROCEDURE [dbo].[GetTournamentsToUpdate]
    @TournamentIdsToCheckCsv VARCHAR(1000)
AS
BEGIN
    SET NOCOUNT ON;

    -- I'm purposefully skipping the scenario of 'Tournament is already excluded', as this
    -- stored procedure is only concerned with tournaments that we should update/check for updates for.
    ; WITH TournamentCte AS (
        SELECT [value] AS [TournamentId]
          FROM STRING_SPLIT(@TournamentIdsToCheckCsv, ',')
    )

    -- This query only targets tournaments, not events at this stage, which is why I'm filtering for ExcludedTournamentEvent IS NULL.
    -- The way I've set this table up is that Tournaments without an EventId means to exclude all events within that tournament.

    -- Statuses in-use here:
    -- ID | Description
    -- 1  | Tournament is new, and hasn't been previously pulled or excluded.
    -- 2  | Tournament already exists and is not excluded, check for updates.
    SELECT tCte.[TournamentId] AS [Id] -- StartGg ID, not table PK ID.
         , t.[UpdatedAt] AS [UpdatedAt]
         , IIF (t.[Id] IS NULL, 1, 2) AS [Status]
      FROM TournamentCte tCte
      LEFT JOIN dbo.Tournament t
        ON tCte.[TournamentId] = t.[StartGgTournamentId]
     WHERE NOT EXISTS (
        SELECT TOP 1 1
          FROM dbo.ExcludedTournamentEvent e
         WHERE tCte.[TournamentId] = e.[StartGgTournamentId]
           AND e.[StartGgEventId] IS NULL
     );
END
GO
GRANT EXECUTE
    ON OBJECT::[dbo].[GetTournamentsToUpdate] TO [TournamentTracker]
    AS [dbo];
GO

--      GetUserPlayersToUpdate:
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
                         , up.[Name]
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
GO

--      GetVideoGamesToUpdate:
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
GO

--      GetVideoGameTournamentPartitions:
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
GO

--      InsertAndGetUsers:
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
GO

--      InsertExcludedTournamentEvents:
CREATE PROCEDURE [dbo].[InsertExcludedTournamentEvents]
    @ExcludedTournamentEventTvp dbo.ExcludedTournamentEventTvp READONLY
AS
BEGIN
    SET NOCOUNT ON;

    INSERT INTO dbo.ExcludedTournamentEvent ([StartGgTournamentId], [StartGgEventId], [ExclusionReason], [ExcludedOn])
    SELECT [StartGgTournamentId]
         , [StartGgEventId]
         , [ExclusionReason]
         , [ExcludedOn]
      FROM @ExcludedTournamentEventTvp;
END
GO
GRANT EXECUTE
    ON OBJECT::[dbo].[InsertExcludedTournamentEvents] TO [TournamentTracker]
    AS [dbo];
GO

--      InsertNewUserSponsorPrefixes:
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
GO

--      InsertStartGgRequestLogEntry:
CREATE PROCEDURE InsertStartGgRequestLogEntry
    @Method VARCHAR(64)
  , @RequestJson NVARCHAR(MAX)
  , @ResponseJson NVARCHAR(MAX)
  , @HttpStatusCode SMALLINT
AS
BEGIN
    SET NOCOUNT ON;

    INSERT INTO dbo.StartGgRequestLog ([Method], [RequestDateTimeUtc], [StartGgRequestJson], [StartGgResponseJson], [HttpStatusCode])
    VALUES (@Method, GETDATE(), @RequestJson, @ResponseJson, @HttpStatusCode);
END
GO
GRANT EXECUTE
    ON OBJECT::[dbo].[InsertStartGgRequestLogEntry] TO [TournamentTracker]
    AS [dbo];
GO

--      InsertVideoGameTournamentPartitionIfRequired:
CREATE PROCEDURE [dbo].[InsertVideoGameTournamentPartitionIfRequired]
    @VideoGameId TINYINT
AS
BEGIN
    SET NOCOUNT ON;
	
    -- If partitioning isn't required, or we can't find the requested VideoGame by its Id, then early return:
    DECLARE @IsPartitionRequired BIT;

    SELECT TOP 1 @IsPartitionRequired = [RequiresDatePartitioning]
      FROM dbo.VideoGame
     WHERE [Id] = @VideoGameId;

    IF @IsPartitionRequired != 1
    BEGIN
        RETURN;
    END

    -- Using the latest of Local or UTC time here to ensure we always have a sufficient number of partitions.
    -- Additionally using DATETIME2 here, as it's more precise (DATETIME seems to lose 3ms of precision, causing it to always round up).
    DECLARE @CurrentDateTime DATETIME2 = GREATEST(SYSDATETIME(), SYSUTCDATETIME());

    DECLARE @Year VARCHAR(4) = CAST(YEAR(@CurrentDateTime) AS VARCHAR(4))
          , @StartOf6MonthPeriod DATETIME2
          , @EndOf6MonthPeriod DATETIME2;

    -- Set @StartOf6MonthPeriod and @EndOf6MonthPeriod depending on whether we are in Jan - May, or June - December:
    IF MONTH(@CurrentDateTime) < 6
    BEGIN
        SELECT @StartOf6MonthPeriod = @Year + '-01-01 00:00:00.000'  -- IE: '2025-01-01 00:00:00.000'
             , @EndOf6MonthPeriod   = @Year + '-05-31 23:59:59.999'; -- IE: '2025-05-31 23:59:59.999'
    END
    ELSE
    BEGIN
        SELECT @StartOf6MonthPeriod = @Year + '-06-01 00:00:00.000'  -- IE: '2025-06-01 00:00:00.000'
             , @EndOf6MonthPeriod   = @Year + '-12-31 23:59:59.999'; -- IE: '2025-12-31 23:59:59.999'
    END

    -- If the current partition doesn't exist, insert it:
    IF NOT EXISTS (SELECT TOP 1 1
                     FROM dbo.VideoGameTournamentPartition
                    WHERE [RangeStart] = @StartOf6MonthPeriod
                      AND [RangeEnd]   = @EndOf6MonthPeriod)
    BEGIN
        INSERT INTO dbo.VideoGameTournamentPartition ([VideoGameId], [RangeStart], [RangeEnd])
                                              VALUES (@VideoGameId, @StartOf6MonthPeriod, @EndOf6MonthPeriod);
    END
END
GO
GRANT EXECUTE
    ON OBJECT::[dbo].[InsertVideoGameTournamentPartitionIfRequired] TO [TournamentTracker]
    AS [dbo];
GO

--      UpdateExistingUsers:
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
        ON upt.[SponsorPrefixName] = sp.[Name];
END
GO
GRANT EXECUTE
    ON OBJECT::[dbo].[UpdateExistingUsers] TO [TournamentTracker]
    AS [dbo];
GO
-- End of creating required stored procedures.


-- Start of inserting starter data:

--      VideoGame, VideoGameCharacterMap, Character and VideoGameTournamentPartition Data:
DECLARE @LastUpdatedUtc        DATETIME = GETUTCDATE()
      , @Tekken8VideoGameId    TINYINT
      , @Tekken3VideoGameId    TINYINT
      , @TekkenTag2VideoGameId TINYINT;

INSERT INTO [dbo].[VideoGame] ([StartGgVideoGameId], [StartGgLastUpdatedUtc], [Name], [DisplayName], [ReleaseDate], [RequiresDatePartitioning])
                       VALUES (49783, @LastUpdatedUtc, 'TEKKEN 8', 'TEKKEN 8', '2024-01-26 00:00:00.000', 1)
                            , (5216 , @LastUpdatedUtc, 'Tekken 3', 'Tekken 3', '1997-03-20 00:00:00.000', 0)
                            , (4985 , @LastUpdatedUtc, 'Tekken Tag Tournament 2', 'Tekken Tag Tournament 2', '2011-09-14 00:00:00.000', 0);

INSERT INTO [dbo].[VideoGameTournamentPartition] ([VideoGameId], [RangeStart], [RangeEnd])
                                          VALUES (1, '2024-01-01 00:00:00.000', '2024-05-31 23:59:59.999')
                                               , (1, '2024-06-01 00:00:00.000', '2024-12-31 23:59:59.999')
                                               , (1, '2025-01-01 00:00:00.000', '2025-05-31 23:59:59.999')
                                               , (1, '2025-06-01 00:00:00.000', '2025-12-31 23:59:59.999');

SELECT @Tekken8VideoGameId    = (SELECT TOP 1 [Id] FROM [dbo].[VideoGame] WHERE [StartGgVideoGameId] = 49783)
     , @Tekken3VideoGameId    = (SELECT TOP 1 [Id] FROM [dbo].[VideoGame] WHERE [StartGgVideoGameId] = 5216)
     , @TekkenTag2VideoGameId = (SELECT TOP 1 [Id] FROM [dbo].[VideoGame] WHERE [StartGgVideoGameId] = 4985);

INSERT INTO [dbo].[Character] ([Name], [AlternativeName])
                       VALUES ('Alisa Bosconovitch', NULL)
                            , ('Anna Williams', NULL)
                            , ('Asuka Kazama', NULL)
                            , ('Azucena Oritz', NULL)
                            , ('Bryan Fury', NULL)
                            , ('Claudio Serafino', NULL)
                            , ('Clive Rosfield', NULL)
                            , ('Devil Jin', NULL)
                            , ('Eddy Gordo', NULL)
                            , ('Emilie de Rochefort', 'Lili')
                            , ('Fahkumram', NULL)
                            , ('Feng Wei', NULL)
                            , ('Heihachi Mishima', NULL)
                            , ('Hwoarang', NULL)
                            , ('Jack-8', 'Jack')
                            , ('Jin Kazama', NULL)
                            , ('Jun Kazama', NULL)
                            , ('Kazuya Mishima', NULL)
                            , ('King', NULL)
                            , ('Kuma', NULL)
                            , ('Lars Alexandersson', NULL)
                            , ('Lee Chaolan', NULL)
                            , ('Leo Kliesen', NULL)
                            , ('Leroy Smith', NULL)
                            , ('Lidia Sobieska', NULL)
                            , ('Ling Xiaoyu', 'Xiaoyu')
                            , ('Marshall Law', 'Law')
                            , ('Nina Williams', NULL)
                            , ('Panda', NULL)
                            , ('Paul Phoenix', NULL)
                            , ('Raven', NULL)
                            , ('Reina Mishima', NULL)
                            , ('Sergei Dragunov', 'Dragunov')
                            , ('Shaheen', NULL)
                            , ('Steve Fox', NULL)
                            , ('Victor Chevalier', NULL)
                            , ('Yoshimitsu', NULL)
                            , ('Zafina', NULL)
                            , ('Dr. Bosconovitch', NULL)
                            , ('Gon', NULL)
                            , ('Lei Wulong', NULL)
                            , ('Julia Chang', 'Jaycee')
                            , ('Mokujin', NULL)
                            , ('Tiger Jackson', NULL)
                            , ('Ogre', NULL)
                            , ('True Ogre', NULL)
                            , ('GunJack', 'Jack')
                            , ('Forest Law', 'Law')
                            , ('Alex', NULL)
                            , ('Ancient Ogre', NULL)
                            , ('Angel', NULL)
                            , ('Armor King', 'King')
                            , ('Baek Doo San', NULL)
                            , ('Bob Richards', 'Bob')
                            , ('Bruce Irvin', NULL)
                            , ('Christie Monteiro', NULL)
                            , ('Combot', NULL)
                            , ('Ganryu', NULL)
                            , ('Jack-6', 'Jack')
                            , ('Jinpachi Mishima', NULL)
                            , ('Kunimitsu', NULL)
                            , ('Craig Marduk', NULL)
                            , ('Michelle Chang', NULL)
                            , ('Miguel Caballero Rojo', NULL)
                            , ('Miharu Hirano', NULL)
                            , ('Prototype Jack', 'Jack')
                            , ('Roger Jr.', NULL)
                            , ('Sebastian', NULL)
                            , ('Slim Bob', 'Bob')
                            , ('Unknown', NULL)
                            , ('Violet', NULL)
                            , ('Wang Jinrei', NULL);

INSERT INTO [dbo].[VideoGameCharacterMap] ([VideoGameId], [CharacterId], [StartGgCharacterId])
SELECT @Tekken8VideoGameId, [Id], NULL
  FROM [dbo].[Character]
 WHERE [Name] IN ('Alisa Bosconovitch',
                  'Anna Williams',
                  'Asuka Kazama',
                  'Azucena Oritz',
                  'Bryan Fury',
                  'Claudio Serafino',
                  'Clive Rosfield',
                  'Devil Jin',
                  'Eddy Gordo',
                  'Emilie de Rochefort',
                  'Fahkumram',
                  'Feng Wei',
                  'Heihachi Mishima',
                  'Hwoarang',
                  'Jack-8',
                  'Jin Kazama',
                  'Jun Kazama',
                  'Kazuya Mishima',
                  'King',
                  'Kuma',
                  'Lars Alexandersson',
                  'Lee Chaolan',
                  'Leo Kliesen',
                  'Leroy Smith',
                  'Lidia Sobieska',
                  'Ling Xiaoyu',
                  'Marshall Law',
                  'Nina Williams',
                  'Panda',
                  'Paul Phoenix',
                  'Raven',
                  'Reina Mishima',
                  'Sergei Dragunov',
                  'Shaheen',
                  'Steve Fox',
                  'Victor Chevalier',
                  'Yoshimitsu',
                  'Zafina');

INSERT INTO [dbo].[VideoGameCharacterMap] ([VideoGameId], [CharacterId], [StartGgCharacterId])
SELECT @Tekken3VideoGameId, [Id], NULL
  FROM [dbo].[Character]
 WHERE [Name] IN ('Anna Williams',
                  'Bryan Fury',
                  'Eddy Gordo',
                  'Heihachi Mishima',
                  'Hwoarang',
                  'Jin Kazama',
                  'King',
                  'Kuma',
                  'Ling Xiaoyu',
                  'Nina Williams',
                  'Panda',
                  'Paul Phoenix',
                  'Yoshimitsu',
                  'Dr. Bosconovitch',
                  'Gon',
                  'Lei Wulong',
                  'Julia Chang',
                  'Mokujin',
                  'Tiger Jackson',
                  'Ogre',
                  'True Ogre',
                  'GunJack',
                  'Forest Law');

INSERT INTO [dbo].[VideoGameCharacterMap] ([VideoGameId], [CharacterId], [StartGgCharacterId])
SELECT @TekkenTag2VideoGameId, [Id], NULL
  FROM [dbo].[Character]
 WHERE [Name] IN ('Alisa Bosconovitch',
                  'Anna Williams',
                  'Asuka Kazama',
                  'Bryan Fury',
                  'Devil Jin',
                  'Eddy Gordo',
                  'Emilie de Rochefort',
                  'Feng Wei',
                  'Heihachi Mishima',
                  'Hwoarang',
                  'Jin Kazama',
                  'Jun Kazama',
                  'Kazuya Mishima',
                  'King',
                  'Kuma',
                  'Lars Alexandersson',
                  'Lee Chaolan',
                  'Leo Kliesen',
                  'Ling Xiaoyu',
                  'Marshall Law',
                  'Nina Williams',
                  'Panda',
                  'Paul Phoenix',
                  'Raven',
                  'Sergei Dragunov',
                  'Steve Fox',
                  'Yoshimitsu',
                  'Zafina',
                  'Dr. Bosconovitch',
                  'Lei Wulong',
                  'Julia Chang',
                  'Mokujin',
                  'Tiger Jackson',
                  'True Ogre',
                  'Forest Law',
                  'Alex',
                  'Ancient Ogre',
                  'Angel',
                  'Armor King',
                  'Baek Doo San',
                  'Bob Richards',
                  'Bruce Irvin',
                  'Christie Monteiro',
                  'Combot',
                  'Ganryu',
                  'Jack-6',
                  'Jinpachi Mishima',
                  'Kunimitsu',
                  'Craig Marduk',
                  'Michelle Chang',
                  'Miguel Caballero Rojo',
                  'Miharu Hirano',
                  'Prototype Jack',
                  'Roger Jr.',
                  'Sebastian',
                  'Slim Bob',
                  'Unknown',
                  'Violet',
                  'Wang Jinrei');

UPDATE vgcm
   SET [StartGgCharacterId]
  FROM [dbo].[VideoGameCharacterMap] vgcm
  JOIN [dbo].[Character] c
    ON vgcm.[CharacterId] = c.[Id]
  JOIN (
    SELECT [Name]
         , [StartGgCharacterId]
      FROM (VALUES
              ('Alisa Bosconovitch', 2406)
            , ('Anna Williams', 2620)
            , ('Asuka Kazama', 2407)
            , ('Azucena Oritz', 2408)
            , ('Bryan Fury', 2409)
            , ('Claudio Serafino', 2410)
            , ('Clive Rosfield', 2612)
            , ('Devil Jin', 2411)
            , ('Eddy Gordo', 2446)
            , ('Emilie de Rochefort', 2424)
            , ('Fahkumram', 2700)
            , ('Feng Wei', 2412)
            , ('Heihachi Mishima', 2598)
            , ('Hwoarang', 2413)
            , ('Jack-8', 2414)
            , ('Jin Kazama', 2415)
            , ('Jun Kazama', 2416)
            , ('Kazuya Mishima', 2417)
            , ('King', 2418)
            , ('Kuma', 2419)
            , ('Lars Alexandersson', 2420)
            , ('Lee Chaolan', 2421)
            , ('Leo Kliesen', 2422)
            , ('Leroy Smith', 2423)
            , ('Lidia Sobieska', 2538)
            , ('Ling Xiaoyu', 2425)
            , ('Marshall Law', 2426)
            , ('Nina Williams', 2427)
            , ('Panda', 2428)
            , ('Paul Phoenix', 2429)
            , ('Raven', 2431)
            , ('Reina Mishima', 2432)
            , ('Sergei Dragunov', 2433)
            , ('Shaheen', 2434)
            , ('Steve Fox', 2435)
            , ('Victor Chevalier', 2436)
            , ('Yoshimitsu', 2437)
            , ('Zafina', 2438)
      ) AS Map ([Name], [StartGgCharacterId])
  ) map
        ON c.[Name] = map.[Name]
 WHERE vgcm.VideoGameId = @Tekken8VideoGameId;

-- End of inserting starter data.
