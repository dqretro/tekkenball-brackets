CREATE TABLE [dbo].[UserPlayer] (
    [Id]              SMALLINT      IDENTITY (1, 1) NOT NULL,
    [UserId]          INT           NOT NULL,
    [PlayerId]        INT           NOT NULL,
    [Slug]            NVARCHAR (64) NULL,
    [SponsorPrefixId] SMALLINT      NULL,
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

