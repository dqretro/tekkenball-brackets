using DQRetro.TournamentTracker.Admin.Tools.Models;
using DQRetro.TournamentTracker.Admin.Tools.Persistence;
using DQRetro.TournamentTracker.Admin.Tools.UserInteractions.Categories;
using DQRetro.TournamentTracker.Admin.Tools.UserInteractions.Categories.Videos;
using DQRetro.TournamentTracker.Admin.Tools.UserInteractions.Categories.Videos.CategoryItems;
using DQRetro.TournamentTracker.Api.Models.Configuration;
using DQRetro.TournamentTracker.Api.Persistence.Database;
using DQRetro.TournamentTracker.Api.Persistence.Database.Interfaces;
using DQRetro.TournamentTracker.Api.Persistence.YouTube;
using DQRetro.TournamentTracker.Api.Persistence.YouTube.Interfaces;
using Microsoft.Extensions.Options;

namespace DQRetro.TournamentTracker.Admin.Tools;

/// <summary>
/// Class for application's entrypoint.
/// </summary>
class Program
{
    /// <summary>
    /// Method for the application's entrypoint.
    /// Handles DI and Running the API.
    /// </summary>
    private static async Task Main()
    {
        try
        {
            FileRepository fileRepository = new();

            Settings settings = await ReadSettingsAsync(fileRepository);

            BaseSqlRepository baseSqlRepository = new(settings);
            bool result = await baseSqlRepository.CheckDatabaseIsReachableAsync();
            if (!result)
            {
                throw new Exception("Unable to connect to database. SELECT 1 query didn't return the expected result.");
            }

            IYouTubeRepository youTubeRepository = new YouTubeExplodeRepository();
            IVideoSqlRepository videoSqlRepository = new VideoSqlRepository(Options.Create(new KeysConfiguration { SqlConnectionString = settings.SqlConnectionString }));
            VideoAdminToolsYouTubeRepository videoAdminToolsYouTubeRepository = new();
            VideoAdminToolsSqlRepository videoAdminToolsSqlRepository = new(settings);

            IReadOnlyDictionary<byte, ICategoryItemSelector> categories = CreateCategories(youTubeRepository, videoSqlRepository, videoAdminToolsYouTubeRepository, videoAdminToolsSqlRepository);

            CategorySelector categorySelector = new(categories);
            await categorySelector.SelectCategoryAsync();
        }
        catch (Exception ex)
        {
            Console.WriteLine($"An error occurred: {ex.Message}");
        }

        // Prevent the app from exiting before being able to see any relevant outputs...
        Console.WriteLine("Press ENTER to exit...");
        Console.ReadLine();
    }

    private static async Task<Settings> ReadSettingsAsync(FileRepository fileRepository)
    {
        string path = Path.Combine(Directory.GetCurrentDirectory(), "Settings.json");
        return await fileRepository.ReadSettingsAsync(path);
    }

    private static IReadOnlyDictionary<byte, ICategoryItemSelector> CreateCategories(IYouTubeRepository youTubeRepository,
                                                                                     IVideoSqlRepository videoSqlRepository,
                                                                                     VideoAdminToolsYouTubeRepository adminToolsYouTubeRepository,
                                                                                     VideoAdminToolsSqlRepository adminToolsSqlRepository)
    {
        Dictionary<byte, ICategoryItemSelector> categories = [];

        IReadOnlyDictionary<byte, ICategoryItem> videoCategoryItems = CreateVideosCategoryItems(youTubeRepository, videoSqlRepository, adminToolsYouTubeRepository, adminToolsSqlRepository);
        categories.Add(1, new VideosCategoryItemSelector(videoCategoryItems));

        return categories;
    }

    private static IReadOnlyDictionary<byte, ICategoryItem> CreateVideosCategoryItems(IYouTubeRepository youTubeRepository,
                                                                                      IVideoSqlRepository videoSqlRepository,
                                                                                      VideoAdminToolsYouTubeRepository adminToolsYouTubeRepository,
                                                                                      VideoAdminToolsSqlRepository adminToolsSqlRepository)
    {
        Dictionary<byte, ICategoryItem> categoryItems = [];

        categoryItems.Add(1, new AddNewVideoChannelCategoryItem(youTubeRepository, adminToolsYouTubeRepository, adminToolsSqlRepository));
        categoryItems.Add(2, new VideoReleaseDateFinderCategoryItem(adminToolsYouTubeRepository, adminToolsSqlRepository));
        categoryItems.Add(3, new ExcludeVideoCategoryItem(adminToolsSqlRepository, videoSqlRepository));

        return categoryItems;
    }
}
