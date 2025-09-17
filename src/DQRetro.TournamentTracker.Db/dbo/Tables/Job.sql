CREATE TABLE [dbo].[Job] (
    [Id]        TINYINT      IDENTITY (1, 1) NOT NULL,
    [Name]      VARCHAR (32) NOT NULL,
    [IsEnabled] BIT          NOT NULL,
    CONSTRAINT [PK_Job] PRIMARY KEY CLUSTERED ([Id] ASC)
);

