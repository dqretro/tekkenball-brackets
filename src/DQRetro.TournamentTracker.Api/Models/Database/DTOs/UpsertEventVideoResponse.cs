namespace DQRetro.TournamentTracker.Api.Models.Database.DTOs;

/// <summary>
/// Model representing the response from dbo.UpsertEventVideos.
/// </summary>
public sealed class UpsertEventVideoResponse
{
    /// <summary>
    /// Will either be INSERT or UPDATE.
    /// Represents whether this object was inserted or updated.
    /// </summary>
    public string ActionType { get; set; }

    /// <summary>
    /// The newly/updated Video Title.
    /// </summary>
    public string Title { get; set; }

    /// <summary>
    /// The YouTube Video ID. This usually forms part of the URL.
    /// </summary>
    public string YouTubeVideoId { get; set; }
}
