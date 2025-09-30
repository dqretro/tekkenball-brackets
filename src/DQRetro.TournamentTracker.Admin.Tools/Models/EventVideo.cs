namespace DQRetro.TournamentTracker.Admin.Tools.Models;

/// <summary>
/// Model representing this API's GetVideos endpoint response.
/// A copy of the APIs EventVideo model code, to avoid importing the API as a dependency, or creating separate modules.
/// </summary>
public sealed class EventVideo
{
    /// <summary>
    /// Video title.
    /// </summary>
    public string Title { get; set; }

    /// <summary>
    /// The YouTube Video ID. This usually forms part of the URL.
    /// </summary>
    public string YouTubeVideoId { get; set; }

    /// <summary>
    /// The URL for this video on YouTube.
    /// </summary>
    public string YouTubeVideoUrl { get; set; }

    /// <summary>
    /// The URL for this video's thumbnail on YouTube.
    /// </summary>
    public string YouTubeThumbnailUrl { get; set; }

    /// <summary>
    /// When this video was uploaded.
    /// This is not automatically populated due to current limitations with YouTubeExplode, so will need to be manually updated if new.
    /// </summary>
    public DateTime? ReleaseDate { get; set; }

    /// <summary>
    /// The uploader's Channel Name.
    /// </summary>
    public string ChannelName { get; set; }

    /// <summary>
    /// The uploader's Channel ID.
    /// </summary>
    public string YouTubeChannelId { get; set; }

    /// <summary>
    /// The associated Event Name for this video.
    /// This may be removed in-future when Events are actually populated.
    /// </summary>
    public string EventName { get; set; }
}
