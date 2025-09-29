using System.Data;
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
    /// Gets a list of all currently tracked YouTube Channels from the VideoChannel table.
    /// </summary>
    /// <returns>Collection of VideoChannels.</returns>
    Task<IEnumerable<YouTubeChannel>> GetYouTubeChannelsAsync();

    /// <summary>
    /// Updates (if already exists) or Inserts (if it doesn't already exist) a collection of EventVideos from the provided DataTable.
    /// </summary>
    /// <param name="eventVideosUpsertTvpDataTable">Datatable to convert to dbo.EventVideoUpsertTvp.</param>
    /// <returns>A collection of modified (updated or inserted) EventVideos.</returns>
    Task<IEnumerable<UpsertEventVideoResponse>> UpsertEventVideosAsync(DataTable eventVideosUpsertTvpDataTable);
}
