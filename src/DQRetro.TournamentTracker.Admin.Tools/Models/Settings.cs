namespace DQRetro.TournamentTracker.Admin.Tools.Models;

/// <summary>
/// Settings used exclusively by this Tools CLI app.
/// </summary>
public sealed class Settings
{
    /// <summary>
    /// Connection String for the TournamentTracker DB.
    /// </summary>
    public string SqlConnectionString { get; set; }
}
