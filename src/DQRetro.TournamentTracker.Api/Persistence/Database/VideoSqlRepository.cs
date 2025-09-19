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
    public async Task<IEnumerable<string>> GetYouTubeChannelIdsAsync()
    {
        const string procName = "dbo.GetYouTubeChannelIds";

        using (SqlConnection connection = await OpenConnectionAsync())
        {
            return await connection.QueryAsync<string>(procName, commandType: CommandType.StoredProcedure);
        }
    }

    /// <inheritdoc />
    public async Task<bool> CheckIfEventVideoExistsAsync(string youTubeVideoId)
    {
        const string procName = "dbo.CheckIfEventVideoExists";

        using (SqlConnection connection = await OpenConnectionAsync())
        {
            DynamicParameters parameters = new();
            parameters.Add("@YouTubeVideoId", youTubeVideoId);

            return await connection.QueryFirstOrDefaultAsync<bool>(procName, parameters, commandType: CommandType.StoredProcedure);
        }
    }

    /// <inheritdoc />
    public async Task InsertEventVideoAsync(InsertEventVideo video)
    {
        const string procName = "dbo.InsertEventVideo";

        using (SqlConnection connection = await OpenConnectionAsync())
        {
            DynamicParameters parameters = new();
            parameters.Add("@YouTubeChannelId", video.YouTubeChannelId);
            parameters.Add("@YouTubeChannelName", video.YouTubeChannelName);
            parameters.Add("@EventId", video.EventId);
            parameters.Add("@Title", video.Title);
            parameters.Add("@YouTubeVideoId", video.YouTubeVideoId);
            parameters.Add("@YouTubeVideoUrl", video.YouTubeVideoUrl);
            parameters.Add("@YouTubeVideoThumbnailUrl", video.YouTubeVideoThumbnailUrl);
            parameters.Add("@ReleaseDate", video.ReleaseDate);

            await connection.ExecuteAsync(procName, parameters, commandType: CommandType.StoredProcedure);
        }
    }

    private async Task<SqlConnection> OpenConnectionAsync()
    {
        SqlConnection connection = new(_connectionString);
        await connection.OpenAsync();
        return connection;
    }
}
