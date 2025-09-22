using DQRetro.TournamentTracker.Api.Models.Api.Responses;
using DQRetro.TournamentTracker.Api.Models.Common;
using DQRetro.TournamentTracker.Api.Services.Video.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace DQRetro.TournamentTracker.Api.Controllers;

[ApiController]
[Route("[controller]")]
public sealed class VideosController : ControllerBase
{
    private readonly IVideoService _videoService;

    public VideosController(IVideoService videoService)
    {
        _videoService = videoService;
    }

    [HttpGet]
    public async Task<IActionResult> GetEventVideosAsync()
    {
        Result<List<EventVideo>> videosResult = await _videoService.GetEventVideosAsync();
        return StatusCode(videosResult.HttpResponseCode, videosResult.Succeeded ? videosResult.SuccessResult : videosResult.Error);
    }
}
