using DQRetro.TournamentTracker.Api.Models.Api.Responses;
using DQRetro.TournamentTracker.Api.Models.Database.DTOs;

namespace DQRetro.TournamentTracker.Api.Persistence.Database.Interfaces;

/// <summary>
/// Signatures for SQL Video Repository implementation.
/// </summary>
public interface IVideoSqlRepository
{
    /// <summary>
    /// Gets all Event Videos.
    /// </summary>
    /// <returns>Collection of Event Videos</returns>
    Task<List<EventVideo>> GetEventVideosAsync();

    /// <summary>
    /// Gets a list of all currently tracked YouTube Channel IDs from the VideoChannel table.
    /// </summary>
    /// <returns>Collection of Video Channel IDs.</returns>
    Task<IEnumerable<string>> GetYouTubeChannelIdsAsync();

    /// <summary>
    /// Checks whether a given EventVideo already exists in the database.
    /// </summary>
    /// <param name="youTubeVideoId">The YouTubeVideoId to check.</param>
    /// <returns>True if it already exists, otherwise false.</returns>
    Task<bool> CheckIfEventVideoExistsAsync(string youTubeVideoId);

    /// <summary>
    /// Inserts a new EventVideo into the EventVideo table.
    /// </summary>
    /// <param name="video">Video to insert.</param>
    /// <returns></returns>
    Task InsertEventVideoAsync(InsertEventVideo video);
}
