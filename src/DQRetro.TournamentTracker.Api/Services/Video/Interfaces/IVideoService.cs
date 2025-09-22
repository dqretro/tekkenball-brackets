using DQRetro.TournamentTracker.Api.Models.Api.Responses;
using DQRetro.TournamentTracker.Api.Models.Common;

namespace DQRetro.TournamentTracker.Api.Services.Video.Interfaces;

/// <summary>
/// Signatures for Video Service implementation.
/// </summary>
public interface IVideoService
{
    /// <summary>
    /// Retrieves a collection of EventVideos.
    /// </summary>
    /// <returns>Collection of EventVideos.</returns>
    Task<Result<List<EventVideo>>> GetEventVideosAsync();

    /// <summary>
    /// Finds new videos from YouTube that don't already exist in the database, and inserts them.
    /// </summary>
    /// <returns></returns>
    Task FindAndInsertNewVideosAsync();
}
