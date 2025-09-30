using System.Text.Json;
using DQRetro.TournamentTracker.Admin.Tools.Models;

namespace DQRetro.TournamentTracker.Admin.Tools.Persistence;

/// <summary>
/// Performs file-related logic.
/// </summary>
public sealed class FileRepository
{
    /// <summary>
    /// Read Settings from the requested filepath.
    /// </summary>
    /// <param name="filePath"></param>
    /// <returns></returns>
    public async Task<Settings> ReadSettingsAsync(string filePath)
    {
        string json = await ReadAllTextAsync(filePath);
        return JsonSerializer.Deserialize<Settings>(json);
    }

    /// <summary>
    /// Reads file contents and returns it as a single string.
    /// </summary>
    /// <param name="filePath"></param>
    /// <returns></returns>
    public async Task<string> ReadAllTextAsync(string filePath)
    {
        return await File.ReadAllTextAsync(filePath);
    }
}
