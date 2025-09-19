CREATE TABLE [dbo].[Venue] (
    [Id]           SMALLINT       IDENTITY (1, 1) NOT NULL,
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

