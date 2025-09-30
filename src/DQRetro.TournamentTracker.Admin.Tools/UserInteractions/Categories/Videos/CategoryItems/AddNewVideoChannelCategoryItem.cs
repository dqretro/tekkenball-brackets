using DQRetro.TournamentTracker.Admin.Tools.Models;
using DQRetro.TournamentTracker.Admin.Tools.Persistence;
using YoutubeExplode.Channels;
using YoutubeExplode.Videos;

namespace DQRetro.TournamentTracker.Admin.Tools.UserInteractions.Categories.Videos.CategoryItems;

/// <summary>
/// Service for finding and adding VideoChannels.
/// Where possible, I am re-using the API's existing classes.
/// This isn't fully possible here, as it's not possible to get the Video's manifests on the API servers currently.
/// </summary>
public sealed class AddNewVideoChannelCategoryItem : ICategoryItem
{
    private readonly VideoAdminToolsYouTubeRepository _videoAdminToolsYouTubeRepository;
    private readonly VideoAdminToolsSqlRepository _videoAdminToolsSqlRepository;

    /// <summary>
    /// Ctor.
    /// </summary>
    /// <param name="videoAdminToolsYouTubeRepository">YouTubeRepository containing admin-only tools logic.</param>
    /// <param name="videoAdminToolsSqlRepository">Videos SQL Repository containing admin-only tools logic.</param>
    public AddNewVideoChannelCategoryItem(VideoAdminToolsYouTubeRepository videoAdminToolsYouTubeRepository,
                                          VideoAdminToolsSqlRepository videoAdminToolsSqlRepository)
    {
        _videoAdminToolsYouTubeRepository = videoAdminToolsYouTubeRepository;
        _videoAdminToolsSqlRepository = videoAdminToolsSqlRepository;
    }

    /// <inheritdoc />
    public string Description { get; } = "Add a new Video Channel";

    /// <inheritdoc />
    public async Task ExecuteAsync()
    {
        ChannelId channelId = ChannelId.Parse(GetChannelIdFromConsole());

        Console.WriteLine("Finding Channel Name from Channel ID...");
        string channelName = await _videoAdminToolsYouTubeRepository.GetChannelNameFromChannelIdAsync(channelId);

        Console.WriteLine("Checking if this Channel already exists in the database...");
        bool channelAlreadyExists = await _videoAdminToolsSqlRepository.CheckIfChannelExistsAsync(channelId, channelName);
        if (channelAlreadyExists)
        {
            Console.WriteLine("Error: Channel already exists.");
            return;
        }

        Console.WriteLine($"Inserting Channel \"{channelName}\" into the database...");
        short videoChannelId = await _videoAdminToolsSqlRepository.InsertChannelAsync(channelId, channelName);

        Console.WriteLine("Finding videos for the requested channel...");
        List<YouTubePlaylistVideo> videosByPlaylist = await _videoAdminToolsYouTubeRepository.GetPlaylistVideosByChannelIdAsync(channelId.ToString());
        if (videosByPlaylist.Count == 0)
        {
            Console.WriteLine("Error: Channel contains no videos.");
            return;
        }

        foreach (YouTubePlaylistVideo video in videosByPlaylist)
        {
            // EventId is not currently supported and will be added at a later stage.
            video.EventId = null;
            video.ReleaseDate = null;
            video.YouTubeVideoUrl = GetYouTubeVideoUrlFromYouTubeVideoId(video.YouTubeVideoId);
            video.YouTubeVideoThumbnailUrl = GetYouTubeVideoThumbnailUrlFromYouTubeVideoId(video.YouTubeVideoId);

            Console.WriteLine($"Finding Release Date for \"{video.Title}\"");
            DateTime releaseDate = await _videoAdminToolsYouTubeRepository.GetReleaseDateFromVideoIdAsync(VideoId.Parse(video.YouTubeVideoId));

            Console.WriteLine($"Inserting video \"{video.Title}\" into the database...");
            await _videoAdminToolsSqlRepository.InsertVideoAsync(videoChannelId, null, video.Title, video.YouTubeVideoId, video.YouTubeVideoUrl, video.YouTubeVideoThumbnailUrl, releaseDate);
        }
    }

    private static string GetChannelIdFromConsole()
    {
        while (true)
        {
            Console.WriteLine($"Enter the YouTube Channel ID.\n" +
                              $"This can be found by inputting the channel handle into this site:\n" +
                              $"https://www.tunepocket.com/youtube-channel-id-finder");

            string input = Console.ReadLine();
            if (!string.IsNullOrEmpty(input))
            {
                return input;
            }

            Console.WriteLine("Error: Input cannot be empty. Try again.");
        }
    }

    private static string GetYouTubeVideoUrlFromYouTubeVideoId(string videoId)
    {
        return $"https://youtu.be/{videoId}";
    }

    private static string GetYouTubeVideoThumbnailUrlFromYouTubeVideoId(string videoId)
    {
        // Available image quality options here are:
        // default.jpg          120 x 90
        // mqdefault.jpg        320 x 180
        // hqdefault.jpg        480 x 360
        // sddefault.jpg        640 x 480
        // maxresdefault.jpg    1280 x 720 (can be lower than this, but this maxes out at 720p)

        // As this will be returned to the UI in a grid, there's no point defaulting to the highest available resolution.
        // hqdefault should be enough for now, but this can be changed here:
        const string qualityOption = "hqdefault";
        return $"https://img.youtube.com/vi/{videoId}/{qualityOption}.jpg";
    }
}
