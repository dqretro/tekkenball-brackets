namespace DQRetro.TournamentTracker.Api.Models.Configuration;

/// <summary>
/// Configuration object representing the "Keys" section within appsettings.Secrets.json.
/// </summary>
public sealed class KeysConfiguration
{
    /// <summary>
    /// The section key within appsettings.Secrets.json to bind to this object.
    /// </summary>
    public const string SectionKey = "Keys";
    
    /// <summary>
    /// The APIKey used when calling StartGG's GraphQL API.
    /// </summary>
    public string StartGgApiKey { get; set; }
    
    /// <summary>
    /// The SQL Server Connection String.
    /// </summary>
    public string SqlConnectionString { get; set; }
}
