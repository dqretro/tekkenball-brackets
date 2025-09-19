CREATE TYPE [dbo].[UserPlayerUpsertTvp] AS TABLE (
    [UserId]            INT           NOT NULL,
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

