using DQRetro.TournamentTracker.Admin.Tools.Models;
using YoutubeExplode;
using YoutubeExplode.Channels;
using YoutubeExplode.Playlists;
using YoutubeExplode.Videos;

namespace DQRetro.TournamentTracker.Admin.Tools.Persistence;

/// <summary>
/// Concrete implementation of additional YouTubeRepository methods that uses YouTubeExplode,
/// that isn't contained within the API's YouTubeExplode wrapper repository.
/// </summary>
public sealed class VideoAdminToolsYouTubeRepository
{
    // Not using YouTubeClient at a class-level, as it's memory inefficient and I want it to be collected ASAP to reduce memory pressure.

    /// <summary>
    /// Retrieves a YouTube Channel's Name by its Channel Id.
    /// </summary>
    /// <param name="channelId">The ChannelId to search for.</param>
    /// <returns>The YouTube Channel Name.</returns>
    public async Task<string> GetChannelNameFromChannelIdAsync(ChannelId channelId)
    {
        YoutubeClient youTubeClient = new();
        Channel channel = await youTubeClient.Channels.GetAsync(channelId);
        return channel.Title;
    }

    /// <summary>
    /// Gets a list of videos for a given YouTube Channel Id.
    /// A slightly modified version of the APIs code.
    /// </summary>
    /// <param name="channelId"></param>
    /// <returns></returns>
    public async Task<List<YouTubePlaylistVideo>> GetPlaylistVideosByChannelIdAsync(string channelId)
    {
        ChannelId channel = ChannelId.Parse(channelId);
        YoutubeClient youTubeClient = new();

        // Whilst I would rather take advantage of the IAsyncEnumerable's efficiency benefits here,
        // this will result in the large allocations from YouTubeExplode staying in memory longer.
        // Therefore, in this case I'd rather force an enumeration.
        List<YouTubePlaylistVideo> videos = [];

        await foreach (PlaylistVideo playlistVideo in youTubeClient.Channels.GetUploadsAsync(channel))
        {
            videos.Add(new YouTubePlaylistVideo
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

    /// <summary>
    /// Retrieves the Upload Date for a YouTube Video by its Video Id.
    /// </summary>
    /// <param name="videoId">The VideoId to search for.</param>
    /// <returns>The Video's upload date (utc).</returns>
    public async Task<DateTime> GetReleaseDateFromVideoIdAsync(VideoId videoId)
    {
        YoutubeClient youTubeClient = new();
        Video video = await youTubeClient.Videos.GetAsync(videoId);
        return video.UploadDate.UtcDateTime;
    }
}
