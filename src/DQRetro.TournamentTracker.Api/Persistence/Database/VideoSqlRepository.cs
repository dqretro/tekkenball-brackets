using System.Data;
using Dapper;
using DQRetro.TournamentTracker.Api.Models.Api.Responses;
using DQRetro.TournamentTracker.Api.Models.Configuration;
using DQRetro.TournamentTracker.Api.Models.Database.DTOs;
using DQRetro.TournamentTracker.Api.Persistence.Database.Interfaces;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Options;

namespace DQRetro.TournamentTracker.Api.Persistence.Database;

/// <summary>
/// Concrete implementation of SQL Video Repository.
/// </summary>
public sealed class VideoSqlRepository : IVideoSqlRepository
{
    private readonly string _connectionString;

    /// <summary>
    /// Ctor.
    /// </summary>
    /// <param name="keyOptions">KeyOptions containing the SQL connection string.</param>
    public VideoSqlRepository(IOptions<KeysConfiguration> keyOptions)
    {
        _connectionString = keyOptions.Value.SqlConnectionString;
    }

    /// <inheritdoc />
    public async Task<List<EventVideo>> GetEventVideosAsync()
    {
        const string procName = "dbo.GetEventVideos";

        using (SqlConnection connection = await OpenConnectionAsync())
        {
            return (await connection.QueryAsync<EventVideo>(procName, commandType: CommandType.StoredProcedure)).ToList();
        }
    }

    /// <inheritdoc />
    public async Task<IEnumerable<YouTubeChannel>> GetYouTubeChannelsAsync()
    {
        const string procName = "dbo.GetYouTubeChannels";

        using (SqlConnection connection = await OpenConnectionAsync())
        {
            return await connection.QueryAsync<YouTubeChannel>(procName, commandType: CommandType.StoredProcedure);
        }
    }

    /// <inheritdoc />
    public async Task<IEnumerable<UpsertEventVideoResponse>> UpsertEventVideosAsync(DataTable eventVideosUpsertTvpDataTable)
    {
        const string procName = "dbo.UpsertEventVideos";
        const string eventVideoTvpName = "dbo.EventVideoUpsertTvp";

        using (SqlConnection connection = await OpenConnectionAsync())
        {
            DynamicParameters parameters = new();
            parameters.Add("@UpdatedEventVideos", eventVideosUpsertTvpDataTable.AsTableValuedParameter(eventVideoTvpName));

            return await connection.QueryAsync<UpsertEventVideoResponse>(procName, parameters, commandType: CommandType.StoredProcedure);
        }
    }

    private async Task<SqlConnection> OpenConnectionAsync()
    {
        SqlConnection connection = new(_connectionString);
        await connection.OpenAsync();
        return connection;
    }
}
