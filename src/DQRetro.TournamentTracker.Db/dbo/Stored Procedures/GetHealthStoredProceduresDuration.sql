CREATE PROCEDURE GetHealthStoredProceduresDuration
AS
BEGIN
    SET NOCOUNT ON;

    ; WITH RuntimeStats AS
    (
        SELECT [plan_id] AS [PlanId]
             , MIN([min_duration]) / 1000.0 AS [MinDurationMs]
             , MAX([max_duration]) / 1000.0 AS [MaxDurationMs]
             , AVG([avg_duration]) / 1000.0 AS [AvgDurationMs]
          FROM sys.query_store_runtime_stats
         GROUP BY [plan_id]
    )

    SELECT p.[name] AS [StoredProcedureName]
         , (SELECT CAST(qsqt.[query_sql_text] AS NVARCHAR(MAX)) FOR XML PATH(''), TYPE) AS [SQL]
         , rs.[MinDurationMs]
         , rs.[MaxDurationMs]
         , rs.[AvgDurationMs]
         , qsq.[query_id] AS [QueryId]
         , qsp.[plan_id] AS [PlanId]
         -- The following columns may be useful in future, but aren't needed now:
         -- , qsp.[is_forced_plan]
         -- , qsp.[query_plan_hash]
         -- , qsp.[plan_forcing_type_desc]
         -- , qsp.[query_plan] -- To pop out the query plan in SSMS, replace this with: CAST(qsp.[query_plan] AS XML) AS plan_xml
      FROM sys.query_store_query qsq
      JOIN sys.objects o
        ON qsq.[object_id] = o.[object_id]
      JOIN sys.procedures p
        ON o.[object_id] = p.[object_id]
      JOIN sys.query_store_query_text qsqt
        ON qsq.[query_text_id] = qsqt.[query_text_id]
      JOIN sys.query_store_plan qsp
        ON qsq.[query_id] = qsp.[query_id]
      JOIN RuntimeStats rs
        ON qsp.[plan_id] = rs.[PlanId]
     WHERE p.[name] NOT IN ('GetHealthStoredProceduresDuration') -- Need to be mindful of what's excluded here.
     ORDER BY MaxDurationMs DESC;
END

GO
GRANT EXECUTE
    ON OBJECT::[dbo].[GetHealthStoredProceduresDuration] TO [TournamentTracker]
    AS [dbo];

