using DQRetro.TournamentTracker.Api.Models.YouTube.Responses;

namespace DQRetro.TournamentTracker.Api.Persistence.YouTube.Interfaces;

/// <summary>
/// Signatures for YouTube Repository implementation.
/// </summary>
public interface IYouTubeRepository
{
    /// <summary>
    /// Gets all YouTube Videos for a given ChannelId.
    /// </summary>
    /// <param name="channelId">ChannelId to filter.</param>
    /// <returns>Collection of videos.</returns>
    Task<IEnumerable<VideosByPlaylistResponse>> GetPlaylistVideosByChannelIdAsync(string channelId);
}
