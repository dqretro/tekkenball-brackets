using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DQRetro.TournamentTracker.Api.Controllers;

/// <summary>
/// API Controller for handling Health-related resources.
/// </summary>
[ApiController]
[Route("[controller]")]
[Authorize(Roles = "Health")] // TODO: "Health" role doesn't currently exist. Just scaffolding the API at this stage.
public sealed class HealthController : ControllerBase
{
    /// <summary>
    /// Gets the current health of the API, DB and Server.
    /// </summary>
    /// <returns>A <see cref="string"/> object if successful, otherwise <see cref="int"/> if unsuccessful.</returns> <!-- TODO: CHANGE THESE! -->
    /// <response code="200">Returns the API's health response object.</response>
    /// <response code="401">User wasn't allowed to access this resource.</response>
    /// <response code="500">Returns an ErrorResponse.</response>
    [HttpGet]
    [ProducesResponseType<string>(StatusCodes.Status200OK)] // TODO: Change from string, when actual implementation exists.
    public async Task<IActionResult> GetHealthAsync()
    {
        await Task.Yield(); // Plan for this endpoint to be asynchronous, temporarily yield until I finish the implementation.
        return Ok("Success");
    }
}
