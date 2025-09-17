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

