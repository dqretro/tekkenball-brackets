CREATE TABLE [dbo].[StartGgRequestLog] (
    [Id]                  INT            IDENTITY (1, 1) NOT NULL,
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

