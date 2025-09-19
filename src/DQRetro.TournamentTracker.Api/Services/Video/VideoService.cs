using DQRetro.TournamentTracker.Api.Models.Api.Responses;
using DQRetro.TournamentTracker.Api.Models.Database.DTOs;
using DQRetro.TournamentTracker.Api.Persistence.Database.Interfaces;
using DQRetro.TournamentTracker.Api.Persistence.YouTube.Interfaces;
using DQRetro.TournamentTracker.Api.Services.Video.Interfaces;

namespace DQRetro.TournamentTracker.Api.Services.Video;

/// <summary>
/// Concrete implementation of Video Service.
/// </summary>
public sealed class VideoService : IVideoService
{
    private readonly IVideoSqlRepository _videoSqlRepository;
    private readonly IYouTubeRepository _youTubeRepository;

    /// <summary>
    /// Ctor.
    /// </summary>
    /// <param name="videoSqlRepository"></param>
    /// <param name="youTubeRepository"></param>
    public VideoService(IVideoSqlRepository videoSqlRepository, IYouTubeRepository youTubeRepository)
    {
        _videoSqlRepository = videoSqlRepository;
        _youTubeRepository = youTubeRepository;
    }

    /// <inheritdoc />
    public async Task<List<EventVideo>> GetEventVideosAsync()
    {
        return await _videoSqlRepository.GetEventVideosAsync();
    }

    /// <inheritdoc />
    public async Task FindAndInsertNewVideosAsync()
    {
        IEnumerable<string> channelIdsToSearch = await _videoSqlRepository.GetYouTubeChannelIdsAsync();

        foreach (string channelId in channelIdsToSearch)
        {
            IEnumerable<InsertEventVideo> videosByChannelId = await _youTubeRepository.GetPlaylistVideosByChannelIdAsync(channelId);

            // TODO: Would be more efficient to turn this into a TVP and a single call, since all videos are already retrieved by this point!
            // TODO: ADD LOGGER CALLS HERE, AND ALERT THAT A NEW VIDEO WAS FOUND!
            foreach (InsertEventVideo video in videosByChannelId)
            {
                bool videoAlreadyExists = await _videoSqlRepository.CheckIfEventVideoExistsAsync(video.YouTubeVideoId);

                if (!videoAlreadyExists)
                {
                    await _videoSqlRepository.InsertEventVideoAsync(video);
                }
            }
        }
    }
}
