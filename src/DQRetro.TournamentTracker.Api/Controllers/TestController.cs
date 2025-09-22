using Microsoft.AspNetCore.Mvc;

namespace DQRetro.TournamentTracker.Api.Controllers;

[ApiController]
[Route("[controller]")]
public sealed class TestController : ControllerBase
{
    // private readonly GetTournamentDetailsService _getTournamentDetailsService;
    //
    // public TestController(GetTournamentDetailsService getTournamentDetailsService)
    // {
    //     _getTournamentDetailsService = getTournamentDetailsService;
    // }

    // TODO: UNCOMMENT THIS ONCE THE IMPLEMENTATION IS FINISHED:
    // [HttpGet("tournament/slug/{slug}")]
    // public async Task<IActionResult> GetTournamentBySlugAsync(string slug)
    // {
    //     var results = await _getTournamentDetailsService.GetTournamentBySlugAsync(slug);
    //     return Ok(results);
    // }
}
