using DQRetro.TournamentTracker.Api.Models.Api.Responses;
using DQRetro.TournamentTracker.Api.Services.Video.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace DQRetro.TournamentTracker.Api.Controllers;

[ApiController]
[Route("[controller]")]
public sealed class VideoController : ControllerBase
{
    private readonly IVideoService _videoService;

    public VideoController(IVideoService videoService)
    {
        _videoService = videoService;
    }

    [HttpGet]
    public async Task<IActionResult> GetEventVideosAsync()
    {
        List<EventVideo> results = await _videoService.GetEventVideosAsync();
        return Ok(results);
    }
}
