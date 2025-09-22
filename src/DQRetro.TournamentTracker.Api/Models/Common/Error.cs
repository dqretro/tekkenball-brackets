using System.Text.Json.Serialization;

namespace DQRetro.TournamentTracker.Api.Models.Common;

public sealed record Error
{
    [JsonPropertyName("code")]
    public int Code { get; init; }

    [JsonPropertyName("message")]
    public string Message { get; init; }
}
