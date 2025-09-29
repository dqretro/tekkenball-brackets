using YoutubeExplode;
using YoutubeExplode.Channels;
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
