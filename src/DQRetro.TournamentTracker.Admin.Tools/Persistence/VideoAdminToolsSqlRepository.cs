using Dapper;
using DQRetro.TournamentTracker.Admin.Tools.Models;
using Microsoft.Data.SqlClient;

namespace DQRetro.TournamentTracker.Admin.Tools.Persistence;

/// <summary>
/// Concrete implementation of Video-related SQL Repository methods.
/// </summary>
public sealed class VideoAdminToolsSqlRepository : BaseSqlRepository
{
    /// <summary>
    /// Ctor.
    /// </summary>
    /// <param name="settings"></param>
    public VideoAdminToolsSqlRepository(Settings settings) : base(settings)
    {
    }

    /// <summary>
    /// Performs a case-insensitive check on the VideoChannel table to check if the requested ChannelId and ChannelName already exist.
    /// </summary>
    /// <param name="channelId"></param>
    /// <param name="channelName"></param>
    /// <returns>True if the channel already exists, else false.</returns>
    public async Task<bool> CheckIfChannelExistsAsync(string channelId, string channelName)
    {
        const string sql = "SELECT TOP 1 1 FROM [dbo].[VideoChannel] WHERE LOWER([YouTubeChannelId]) = LOWER(@ChannelId) AND LOWER([Name]) = LOWER(@ChannelName)";

        using (SqlConnection connection = await OpenConnectionAsync())
        {
            DynamicParameters parameters = new();
            parameters.Add("@ChannelId", channelId);
            parameters.Add("@ChannelName", channelName);
            return await connection.QueryFirstOrDefaultAsync<bool>(sql, parameters);
        }
    }

    /// <summary>
    /// Inserts a new VideoChannel by the ChannelId and ChannelName.
    /// </summary>
    /// <param name="channelId"></param>
    /// <param name="channelName"></param>
    /// <returns>The inserted ID.</returns>
    public async Task<short> InsertChannelAsync(string channelId, string channelName)
    {
        const string sql = "INSERT INTO [dbo].[VideoChannel] ([YouTubeChannelId], [Name]) OUTPUT INSERTED.Id VALUES (@ChannelId, @ChannelName);";

        using (SqlConnection connection = await OpenConnectionAsync())
        {
            DynamicParameters parameters = new();
            parameters.Add("@ChannelId", channelId);
            parameters.Add("@ChannelName", channelName);
            return await connection.QueryFirstOrDefaultAsync<short>(sql, parameters);
        }
    }

    /// <summary>
    /// Inserts a new EventVideo, with its associated properties.
    /// </summary>
    /// <param name="videoChannelId"></param>
    /// <param name="eventId"></param>
    /// <param name="title"></param>
    /// <param name="videoId"></param>
    /// <param name="videoUrl"></param>
    /// <param name="thumbnailUrl"></param>
    /// <param name="releaseDate"></param>
    public async Task InsertVideoAsync(short videoChannelId, short? eventId, string title, string videoId, string videoUrl, string thumbnailUrl, DateTime releaseDate)
    {
        const string sql = "INSERT INTO [dbo].[EventVideo] ([VideoChannelId], [EventId], [Title], [YoutubeVideoId], [YouTubeVideoUrl], [YouTubeThumbnailUrl], [ReleaseDate], [ExcludedOn]) VALUES (@VideoChannelId, @EventId, @Title, @YouTubeVideoId, @YouTubeVideoUrl, @YouTubeThumbnailUrl, @ReleaseDate, NULL);";

        using (SqlConnection connection = await OpenConnectionAsync())
        {
            DynamicParameters parameters = new();
            parameters.Add("@VideoChannelId", videoChannelId);
            parameters.Add("@EventId", eventId);
            parameters.Add("@Title", title);
            parameters.Add("@YouTubeVideoId", videoId);
            parameters.Add("@YouTubeVideoUrl", videoUrl);
            parameters.Add("@YouTubeThumbnailUrl", thumbnailUrl);
            parameters.Add("@ReleaseDate", releaseDate);
            await connection.ExecuteAsync(sql, parameters);
        }
    }

    /// <summary>
    /// Sets ExcludedOn to the current UTC DateTime for the requested EventVideo (by VideoId).
    /// This prevents the API from returning this Video.
    /// </summary>
    /// <param name="videoId"></param>
    public async Task ExcludeVideoAsync(string videoId)
    {
        // This app could run from a variety of machines, and I want a consistent server DateTime.
        // Therefore, I will be using the DB's clock.
        const string sql = "DECLARE @UtcNow DATETIME = GETUTCDATE(); UPDATE [dbo].[EventVideo] SET [ExcludedOn] = @UtcNow WHERE [YouTubeVideoId] = @VideoId";

        using (SqlConnection connection = await OpenConnectionAsync())
        {
            DynamicParameters parameters = new();
            parameters.Add("@VideoId", videoId);
            await connection.ExecuteAsync(sql, parameters);
        }
    }

    /// <summary>
    /// Retrieves a list of YouTube VideoIds that don't have a ReleaseDate.
    /// </summary>
    /// <returns></returns>
    public async Task<List<string>> GetVideosWithoutReleaseDatesAsync()
    {
        const string sql = "SELECT [YouTubeVideoId] FROM [dbo].[EventVideo] WHERE [ReleaseDate] IS NULL;";

        using (SqlConnection connection = await OpenConnectionAsync())
        {
            return (await connection.QueryAsync<string>(sql)).ToList();
        }
    }

    /// <summary>
    /// Sets the ReleaseDate for an EventVideo (by YouTube VideoId).
    /// </summary>
    /// <param name="videoId"></param>
    /// <param name="releaseDate"></param>
    public async Task UpdateVideoReleaseDateAsync(string videoId, DateTime releaseDate)
    {
        const string sql = "UPDATE [dbo].[EventVideo] SET [ReleaseDate] = @ReleaseDate WHERE [YouTubeVideoId] = @VideoId;";

        using (SqlConnection connection = await OpenConnectionAsync())
        {
            DynamicParameters parameters = new();
            parameters.Add("@VideoId", videoId);
            parameters.Add("@ReleaseDate", releaseDate);
            await connection.ExecuteAsync(sql, parameters);
        }
    }
}
