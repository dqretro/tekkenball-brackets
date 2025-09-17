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

