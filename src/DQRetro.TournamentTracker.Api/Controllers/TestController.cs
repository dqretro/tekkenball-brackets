using Microsoft.AspNetCore.Http.Extensions;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;

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

    private readonly ForwardedHeadersOptions _forwardedHeadersOptions;

    public TestController(IOptions<ForwardedHeadersOptions> forwardedHeadersOptions)
    {
        _forwardedHeadersOptions = forwardedHeadersOptions.Value;
    }

    [HttpGet("forwardedheaders")]
    public async Task<IActionResult> GetForwardedHeadersAsync()
    {
        await Task.Yield();

        var requestDetails = new
        {
            Protocol = HttpContext.Request.Protocol,
            Scheme = HttpContext.Request.Scheme,
            Path = HttpContext.Request.Path.Value,
            PathBase = HttpContext.Request.PathBase.Value,
            Host = HttpContext.Request.Host.ToString(),
            DisplayUrl = HttpContext.Request.GetDisplayUrl(),
            RemoteIpAddress = HttpContext.Connection.RemoteIpAddress?.ToString(),
            Headers = HttpContext.Request.Headers
                .ToDictionary(h => h.Key, h => h.Value.ToString()),

            ForwardedHeaders = new
            {
                ForwardedHeaders = GetEnabledFlags(_forwardedHeadersOptions.ForwardedHeaders),
                AllowedHosts = _forwardedHeadersOptions.AllowedHosts.ToList(),
                KnownNetworks = _forwardedHeadersOptions.KnownNetworks.Select(n => n.Prefix + "/" + n.PrefixLength).ToList(),
                KnownProxies = _forwardedHeadersOptions.KnownProxies.Select(p => p.ToString()).ToList(),
                _forwardedHeadersOptions.ForwardLimit,
                _forwardedHeadersOptions.OriginalForHeaderName,
                _forwardedHeadersOptions.OriginalHostHeaderName,
                _forwardedHeadersOptions.OriginalProtoHeaderName,
                _forwardedHeadersOptions.OriginalPrefixHeaderName,
                _forwardedHeadersOptions.ForwardedForHeaderName,
                _forwardedHeadersOptions.ForwardedHostHeaderName,
                _forwardedHeadersOptions.ForwardedProtoHeaderName,
                _forwardedHeadersOptions.ForwardedPrefixHeaderName
            }
        };

        return Ok(requestDetails);
    }

    private static List<string> GetEnabledFlags(ForwardedHeaders headers)
    {
        return Enum.GetValues<ForwardedHeaders>().Where(flag => flag != ForwardedHeaders.None && headers.HasFlag(flag))
                                                 .Select(flag => flag.ToString())
                                                 .ToList();
    }
}
