using DQRetro.TournamentTracker.Admin.Tools.Persistence;
using YoutubeExplode.Videos;

namespace DQRetro.TournamentTracker.Admin.Tools.UserInteractions.Categories.Videos.CategoryItems;

/// <summary>
/// Service for updating the ReleaseDate on existing videos.
/// This is required because the API server is unable to retrieve these details when attempting updates.
/// </summary>
public sealed class VideoReleaseDateFinderCategoryItem : ICategoryItem
{
    private readonly VideoAdminToolsYouTubeRepository _videoAdminToolsYouTubeRepository;
    private readonly VideoAdminToolsSqlRepository _videoAdminToolsSqlRepository;

    /// <summary>
    /// Ctor.
    /// </summary>
    /// <param name="videoAdminToolsYouTubeRepository"></param>
    /// <param name="videoAdminToolsSqlRepository"></param>
    public VideoReleaseDateFinderCategoryItem(VideoAdminToolsYouTubeRepository videoAdminToolsYouTubeRepository,
                                              VideoAdminToolsSqlRepository videoAdminToolsSqlRepository)
    {
        _videoAdminToolsYouTubeRepository = videoAdminToolsYouTubeRepository;
        _videoAdminToolsSqlRepository = videoAdminToolsSqlRepository;
    }

    /// <inheritdoc />
    public string Description { get; } = "Find ReleaseDates for existing videos";

    /// <inheritdoc />
    public async Task ExecuteAsync()
    {
        Console.WriteLine("Finding videos without release dates...");
        List<string> videosWithoutReleaseDates = await _videoAdminToolsSqlRepository.GetVideosWithoutReleaseDatesAsync();

        if (videosWithoutReleaseDates.Count == 0)
        {
            Console.WriteLine("All videos contain release dates, therefore this is unnecessary.");
            return;
        }

        foreach (string videoId in videosWithoutReleaseDates)
        {
            Console.WriteLine($"Finding Release Date for VideoId \"{videoId}\"");
            DateTime releaseDate = await _videoAdminToolsYouTubeRepository.GetReleaseDateFromVideoIdAsync(VideoId.Parse(videoId));

            Console.WriteLine($"Updating release date for VideoId \"{videoId}\" in the database...");
            await _videoAdminToolsSqlRepository.UpdateVideoReleaseDateAsync(videoId, releaseDate);
        }
    }
}
