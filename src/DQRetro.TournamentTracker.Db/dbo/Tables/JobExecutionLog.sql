CREATE TABLE [dbo].[JobExecutionLog] (
    [Id]           INT            IDENTITY (1, 1) NOT NULL,
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