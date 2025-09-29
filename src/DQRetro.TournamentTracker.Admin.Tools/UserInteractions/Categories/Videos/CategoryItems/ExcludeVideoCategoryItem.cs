using DQRetro.TournamentTracker.Admin.Tools.Persistence;
using DQRetro.TournamentTracker.Api.Models.Api.Responses;
using DQRetro.TournamentTracker.Api.Persistence.Database.Interfaces;

namespace DQRetro.TournamentTracker.Admin.Tools.UserInteractions.Categories.Videos.CategoryItems;

/// <summary>
/// Service for excluding existing video(s).
/// </summary>
public sealed class ExcludeVideoCategoryItem : ICategoryItem
{
    private readonly VideoAdminToolsSqlRepository _videoAdminToolsSqlRepository;
    private readonly IVideoSqlRepository _videoSqlRepository;

    /// <summary>
    /// Ctor.
    /// </summary>
    /// <param name="videoAdminToolsSqlRepository"></param>
    /// <param name="videoSqlRepository"></param>
    public ExcludeVideoCategoryItem(VideoAdminToolsSqlRepository videoAdminToolsSqlRepository,
                                    IVideoSqlRepository videoSqlRepository)
    {
        _videoAdminToolsSqlRepository = videoAdminToolsSqlRepository;
        _videoSqlRepository = videoSqlRepository;
    }

    /// <inheritdoc />
    public string Description { get; } = "Exclude existing video (won't show up in API responses)";

    /// <inheritdoc />
    public async Task ExecuteAsync()
    {
        Console.WriteLine("Finding videos...");
        List<EventVideo> videos = await _videoSqlRepository.GetEventVideosAsync();

        if (videos.Count == 0)
        {
            Console.WriteLine("No videos found, therefore this is unnecessary.");
            return;
        }

        Console.WriteLine("Enter the number to the left of the video you wish to exclude:");
        for (ushort count = 1; count <= videos.Count; count++)
        {
            Console.WriteLine($"{count}\t\"{videos[count].Title}\"\tBy\"{videos[count].ChannelName}\"");
        }

        ushort videoIndex;
        while (true)
        {
            string userInput = Console.ReadLine();
            if (ushort.TryParse(userInput, out videoIndex) || videoIndex < 1 || videoIndex > videos.Count)
            {
                // Return to 0-based indexing:
                videoIndex--;
                break;
            }

            Console.WriteLine("Error: Input could not be parsed. Try again.");
        }

        Console.WriteLine($"Excluding Video \"{videos[videoIndex].Title}\" by \"{videos[videoIndex].ChannelName}\"");
        await _videoAdminToolsSqlRepository.ExcludeVideoAsync(videos[videoIndex].YouTubeVideoId);
    }
}
