using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DQRetro.TournamentTracker.Api.Controllers;

[ApiController]
[Route("[controller]")]
[Authorize(Roles = "Health")] // TODO: "Health" role doesn't currently exist. Just scaffolding the API at this stage.
public sealed class HealthController : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetHealthAsync()
    {
        await Task.Yield(); // Plan for this endpoint to be asynchronous, temporarily yield until I finish the implementation.
        return Ok();
    }
}
