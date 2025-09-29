using DQRetro.TournamentTracker.Api.Models.YouTube.Responses;
using DQRetro.TournamentTracker.Api.Persistence.YouTube.Interfaces;
using YoutubeExplode;
using YoutubeExplode.Channels;
using YoutubeExplode.Playlists;

namespace DQRetro.TournamentTracker.Api.Persistence.YouTube;

/// <summary>
/// Concrete implementation of YouTubeExplode Repository.
/// </summary>
public sealed class YouTubeExplodeRepository : IYouTubeRepository
{
    // Not using YouTubeClient at a class-level, as it's memory inefficient and I want it to be collected ASAP to reduce memory pressure.

    public async Task<IEnumerable<VideosByPlaylistResponse>> GetPlaylistVideosByChannelIdAsync(string channelId)
    {
        ChannelId channel = ChannelId.Parse(channelId);
        YoutubeClient youTubeClient = new();

        // Whilst I would rather take advantage of the IAsyncEnumerable's efficiency benefits here,
        // this will result in the large allocations from YouTubeExplode staying in memory longer.
        // Therefore, in this case I'd rather force an enumeration.
        List<VideosByPlaylistResponse> videos = [];

        await foreach (PlaylistVideo playlistVideo in youTubeClient.Channels.GetUploadsAsync(channel))
        {
            videos.Add(new VideosByPlaylistResponse
            {
                EventId = null,
                Title = playlistVideo.Title,
                YouTubeVideoId = playlistVideo.Id,
                YouTubeVideoUrl = playlistVideo.Url,
                YouTubeVideoThumbnailUrl = playlistVideo.Thumbnails.MaxBy(thumbnail => thumbnail.Resolution.Width * thumbnail.Resolution.Height).Url,
                ReleaseDate = null
            });
        }

        return videos;
    }
}
