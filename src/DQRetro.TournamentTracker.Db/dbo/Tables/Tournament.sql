CREATE TABLE [dbo].[Tournament] (
    [Id]                   SMALLINT      IDENTITY (1, 1) NOT NULL,
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

