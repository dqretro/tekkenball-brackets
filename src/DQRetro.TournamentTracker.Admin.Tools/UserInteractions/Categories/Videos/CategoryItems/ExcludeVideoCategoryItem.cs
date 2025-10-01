using System.Text.RegularExpressions;
using DQRetro.TournamentTracker.Admin.Tools.Models;
using DQRetro.TournamentTracker.Admin.Tools.Persistence;

namespace DQRetro.TournamentTracker.Admin.Tools.UserInteractions.Categories.Videos.CategoryItems;

/// <summary>
/// Service for excluding existing video(s).
/// </summary>
public sealed class ExcludeVideoCategoryItem : ICategoryItem
{
    private static readonly Regex CsvRegex = new(@"^\d+(,\d+)*$", RegexOptions.Compiled);
    private static readonly Regex NumberRangeRegex = new(@"^\d+-\d+$", RegexOptions.Compiled);

    private readonly VideoAdminToolsSqlRepository _videoAdminToolsSqlRepository;

    /// <summary>
    /// Ctor.
    /// </summary>
    /// <param name="videoAdminToolsSqlRepository"></param>
    public ExcludeVideoCategoryItem(VideoAdminToolsSqlRepository videoAdminToolsSqlRepository)
    {
        _videoAdminToolsSqlRepository = videoAdminToolsSqlRepository;
    }

    /// <inheritdoc />
    public string Description { get; } = "Exclude existing video (won't show up in API responses)";

    /// <inheritdoc />
    public async Task ExecuteAsync()
    {
        Console.WriteLine("Finding videos...");
        List<EventVideo> videos = await _videoAdminToolsSqlRepository.GetEventVideosAsync();

        if (videos.Count == 0)
        {
            Console.WriteLine("No videos found, therefore this is unnecessary.");
            return;
        }

        List<ushort> videoIndexes = GetVideoIndexesToExclude(videos);
        string videoIdsCsv = GetVideoIdsCsvToExclude(videos, videoIndexes);
        await _videoAdminToolsSqlRepository.ExcludeVideosAsync(videoIdsCsv);

        Console.WriteLine("Videos successfully excluded...");
    }

    private static List<ushort> GetVideoIndexesToExclude(List<EventVideo> videos)
    {
        Console.WriteLine("Enter the numbers to the left of the video you wish to exclude:\n" +
                          "Valid inputs include the following types, and should not include spaces.\n" +
                          "It's currently only possible to perform one range at a time, and 1 input type at a time:\n" +
                          "\tNumber Ranges (ie: 1-3 which would select videos 1, 2, and 3 for exclusion)\n" +
                          "\tNumbers CSV (ie: 4,5,6 which would select videos 4, 5, and 6 for exclusion)\n" +
                          "\tSingle numbers (ie: 7 which would select video 7 for exclusion):");
        for (ushort count = 1; count <= videos.Count; count++)
        {
            Console.WriteLine($"{count}\t\"{videos[count - 1].Title}\"\tBy \"{videos[count - 1].ChannelName}\"");
        }

        List<ushort> videoIndexes = [];

        while (true)
        {
            string userInput = Console.ReadLine();
            if (string.IsNullOrEmpty(userInput))
            {
                Console.WriteLine("Error: Input could not be empty. Try again.");
            }
            else if (IsValidCsvInput(userInput))
            {
                IEnumerable<ushort> numbers = userInput.Split(',')
                                                       .Select(num => ushort.Parse(num));

                videoIndexes.AddRange(numbers);
            }
            else if (IsValidNumberRangeInput(userInput))
            {
                ushort[] numbers = userInput.Split('-')
                                            .Select(num => ushort.Parse(num))
                                            .OrderBy(num => num)
                                            .ToArray();

                IEnumerable<ushort> numberRanges = Enumerable.Range(numbers[0], numbers[1] - numbers[0] + 1)
                                                             .Select(num => (ushort)num);

                videoIndexes.AddRange(numberRanges);
            }
            else if (ushort.TryParse(userInput, out ushort videoIndex))
            {
                videoIndexes.Add(videoIndex);
            }

            if (IsValidVideoIndexes(videos, videoIndexes))
            {
                break;
            }

            Console.WriteLine("Error: Input could not be parsed. Try again.");
        }

        return videoIndexes;
    }

    private static bool IsValidCsvInput(string csvInput)
    {
        return CsvRegex.IsMatch(csvInput);
    }

    private static bool IsValidNumberRangeInput(string numberRangeInput)
    {
        return NumberRangeRegex.IsMatch(numberRangeInput);
    }

    private static bool IsValidVideoIndexes(List<EventVideo> videos, List<ushort> videoIndexes)
    {
        return videoIndexes.Count > 0 && videoIndexes.TrueForAll(num => num >= 1 && num <= videos.Count);
    }

    private static string GetVideoIdsCsvToExclude(List<EventVideo> videos, List<ushort> videoIndexes)
    {
        // videoIndexes are the "more friendly" 1-based indexing, so convert to 0-based indexing before converting to csv:
        IEnumerable<string> videoIds = videoIndexes.Select(num => videos[num - 1].YouTubeVideoId);
        return string.Join(',', videoIds);
    }
}
