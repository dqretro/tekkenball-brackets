namespace DQRetro.TournamentTracker.Api.Models.Database.DTOs;

/// <summary>
/// Model representing the variables required for dbo.InsertEventVideo.
/// </summary>
public sealed class InsertEventVideo
{
    /// <summary>
    /// The uploader's Channel ID.
    /// </summary>
    public string YouTubeChannelId { get; set; }

    /// <summary>
    /// The uploader's Channel Name.
    /// </summary>
    public string YouTubeChannelName { get; set; }

    /// <summary>
    /// The associated Event ID for this video.
    /// This is not currently automatically populated.
    /// </summary>
    public short? EventId { get; set; }

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
    public string YouTubeVideoThumbnailUrl { get; set; }

    /// <summary>
    /// When this video was uploaded.
    /// This is not automatically populated due to current limitations with YouTubeExplode, so will need to be manually updated if new.
    /// </summary>
    public DateTime? ReleaseDate { get; set; }
}
