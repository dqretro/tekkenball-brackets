CREATE TABLE [dbo].[Event] (
    [Id]              SMALLINT       NOT NULL,
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

