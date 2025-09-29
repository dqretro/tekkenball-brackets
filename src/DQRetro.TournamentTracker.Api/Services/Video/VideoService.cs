using System.Data;
using DQRetro.TournamentTracker.Api.Models.Api.Responses;
using DQRetro.TournamentTracker.Api.Models.Common;
using DQRetro.TournamentTracker.Api.Models.Database.DTOs;
using DQRetro.TournamentTracker.Api.Models.YouTube.Responses;
using DQRetro.TournamentTracker.Api.Persistence.Database.Interfaces;
using DQRetro.TournamentTracker.Api.Persistence.YouTube.Interfaces;
using DQRetro.TournamentTracker.Api.Services.Video.Interfaces;

namespace DQRetro.TournamentTracker.Api.Services.Video;

/// <summary>
/// Concrete implementation of Video Service.
/// </summary>
public sealed class VideoService : IVideoService
{
    #region EventVideoUpsertTvp column names:
    private const string VideoChannelIdColumnName = "VideoChannelId";
    private const string TitleColumnName = "Title";
    private const string YouTubeVideoIdColumnName = "YouTubeVideoId";
    private const string YouTubeVideoUrl = "YouTubeVideoUrl";
    private const string YouTubeVideoThumbnailUrl = "YouTubeVideoThumbnailUrl";
    #endregion

    private readonly IVideoSqlRepository _videoSqlRepository;
    private readonly IYouTubeRepository _youTubeRepository;
    private readonly ILogger<VideoService> _logger;

    /// <summary>
    /// Ctor.
    /// </summary>
    /// <param name="videoSqlRepository"></param>
    /// <param name="youTubeRepository"></param>
    /// <param name="logger"></param>
    public VideoService(IVideoSqlRepository videoSqlRepository, IYouTubeRepository youTubeRepository, ILogger<VideoService> logger)
    {
        _videoSqlRepository = videoSqlRepository;
        _youTubeRepository = youTubeRepository;
        _logger = logger;
    }

    /// <inheritdoc />
    public async Task<Result<List<EventVideo>>> GetEventVideosAsync()
    {
        List<EventVideo> videos = await _videoSqlRepository.GetEventVideosAsync();

        if (videos.Count == 0)
        {
            return Result<List<EventVideo>>.Failure(Code.NoResultsFound);
        }

        return Result<List<EventVideo>>.Success(videos);
    }

    /// <inheritdoc />
    public async Task FindAndInsertNewVideosAsync()
    {
        using (DataTable upsertDataTable = CreateEventVideosUpsertTvpDataTable())
        {
            IEnumerable<YouTubeChannel> channelsToSearch = await _videoSqlRepository.GetYouTubeChannelsAsync();

            foreach (YouTubeChannel channel in channelsToSearch)
            {
                IEnumerable<VideosByPlaylistResponse> videosByChannelId = await _youTubeRepository.GetPlaylistVideosByChannelIdAsync(channel.YouTubeChannelId);

                foreach (VideosByPlaylistResponse video in videosByChannelId)
                {
                    AddEventVideoUpsertTvpDataRowToDataTable(upsertDataTable,
                                                             channel.Id,
                                                             video.Title,
                                                             video.YouTubeVideoId,
                                                             video.YouTubeVideoUrl,
                                                             video.YouTubeVideoThumbnailUrl);

                    await UpsertEventVideosChunkIfRequiredAsync(upsertDataTable);
                }
            }

            await UpsertEventVideosChunkIfRequiredAsync(upsertDataTable, forced: true);
        }
    }

    private static DataTable CreateEventVideosUpsertTvpDataTable()
    {
        DataTable upsertDataTable = new();

        upsertDataTable.Columns.Add(VideoChannelIdColumnName, typeof(short));
        upsertDataTable.Columns.Add(TitleColumnName, typeof(string));
        upsertDataTable.Columns.Add(YouTubeVideoIdColumnName, typeof(string));
        upsertDataTable.Columns.Add(YouTubeVideoUrl, typeof(string));
        upsertDataTable.Columns.Add(YouTubeVideoThumbnailUrl, typeof(string));

        return upsertDataTable;
    }

    private static void AddEventVideoUpsertTvpDataRowToDataTable(DataTable upsertDataTable,
                                                                 short videoChannelId,
                                                                 string videoTitle,
                                                                 string youTubeVideoId,
                                                                 string youTubeVideoUrl,
                                                                 string youTubeVideoThumbnailUrl)
    {
        DataRow row = upsertDataTable.NewRow();

        row[VideoChannelIdColumnName] = videoChannelId;
        row[TitleColumnName] = videoTitle;
        row[YouTubeVideoIdColumnName] = youTubeVideoId;
        row[YouTubeVideoUrl] = youTubeVideoUrl;
        row[YouTubeVideoThumbnailUrl] = youTubeVideoThumbnailUrl;

        upsertDataTable.Rows.Add(row);
    }

    private async Task UpsertEventVideosChunkIfRequiredAsync(DataTable dataTable, bool forced = false)
    {
        const short upsertChunkSize = 100;

        if (dataTable.Rows.Count >= upsertChunkSize || forced)
        {
            IEnumerable<UpsertEventVideoResponse> modifiedEventVideos = await _videoSqlRepository.UpsertEventVideosAsync(dataTable);
            LogModifiedEventVideos(modifiedEventVideos);
            dataTable.Rows.Clear();
        }
    }

    private void LogModifiedEventVideos(IEnumerable<UpsertEventVideoResponse> modifiedEventVideos)
    {
        foreach (UpsertEventVideoResponse modifiedEventVideo in modifiedEventVideos)
        {
            _logger.LogInformation("YouTube Video with the VideoID of {VideoId} and Title of {VideoTitle} was saved ({Action})",
                                   modifiedEventVideo.YouTubeVideoId,
                                   modifiedEventVideo.Title,
                                   modifiedEventVideo.ActionType);
        }
    }
}
