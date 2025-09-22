using DQRetro.TournamentTracker.Api.Models.Api.Responses;
using DQRetro.TournamentTracker.Api.Models.Common;
using DQRetro.TournamentTracker.Api.Services.Video.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace DQRetro.TournamentTracker.Api.Controllers;

/// <summary>
/// API Controller for handling Video-related resources.
/// </summary>
[ApiController]
[Route("[controller]")]
public sealed class VideosController : ControllerBase
{
    private readonly IVideoService _videoService;

    /// <summary>
    /// Ctor.
    /// </summary>
    /// <param name="videoService"></param>
    public VideosController(IVideoService videoService)
    {
        _videoService = videoService;
    }

    /// <summary>
    /// Gets the current health of the API, DB and Server.
    /// </summary>
    /// <returns>A collection of EventVideo (<see cref="EventVideo"/>) objects if successful, otherwise <see cref="Error"/> if unsuccessful.</returns>
    /// <response code="200">Returns a collection of EventVideos.</response>
    /// <response code="404">No videos were found, returns Error.</response>
    /// <response code="500">An environmental issue occurred, returns Error.</response>
    [HttpGet]
    [ProducesResponseType<List<EventVideo>>(StatusCodes.Status200OK)]
    [ProducesResponseType<Error>(StatusCodes.Status404NotFound)]
    [ProducesResponseType<Error>(StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> GetEventVideosAsync()
    {
        Result<List<EventVideo>> videosResult = await _videoService.GetEventVideosAsync();
        return StatusCode(videosResult.HttpResponseCode, videosResult.Succeeded ? videosResult.SuccessResult : videosResult.Error);
    }
}
