namespace DQRetro.TournamentTracker.Api.Models.Database.DTOs;

/// <summary>
/// Model representing the VideoChannel table's main fields required for performing an EventVideo Upsert (Id and YouTubeChannelId).
/// </summary>
public sealed class YouTubeChannel
{
    /// <summary>
    /// The Id (PK) on the VideoChannel table.
    /// </summary>
    public short Id { get; set; }

    /// <summary>
    /// The uploader's YouTube Channel ID.
    /// </summary>
    public string YouTubeChannelId { get; set; }
}
