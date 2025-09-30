namespace DQRetro.TournamentTracker.Admin.Tools.UserInteractions.Categories.Videos;

/// <inheritdoc />
public sealed class VideosCategoryItemSelector : ICategoryItemSelector
{
    private readonly IReadOnlyDictionary<byte, ICategoryItem> _categoryItems;
    private readonly List<string> _categoryItemDescriptions;
    private readonly byte _goBackOption;

    /// <summary>
    /// Ctor.
    /// </summary>
    /// <param name="categoryItems"></param>
    public VideosCategoryItemSelector(IReadOnlyDictionary<byte, ICategoryItem> categoryItems)
    {
        _categoryItems = categoryItems;
        _categoryItemDescriptions = _categoryItems.Select(kvp => $"{kvp.Key} - {kvp.Value.Description}").ToList();
        _goBackOption = (byte)(_categoryItems.Count + 1);
        _categoryItemDescriptions.Add($"{_goBackOption} - Go Back");
    }

    /// <inheritdoc />
    public string Description { get; } = "Videos";

    /// <inheritdoc />
    public async Task SelectAndExecuteCategoryItemAsync()
    {
        while (true)
        {
            Console.WriteLine("Video Category Options:\n");
            Console.WriteLine(string.Join('\n', _categoryItemDescriptions));

            string userInput = Console.ReadLine();
            if (!byte.TryParse(userInput, out byte userInputByte) || userInputByte < 1 || userInputByte > _goBackOption)
            {
                Console.WriteLine("Error: Input could not be parsed. Try again.");
                continue;
            }
            else if (userInputByte == _goBackOption)
            {
                return;
            }

            ICategoryItem categoryItem = _categoryItems[userInputByte];
            await categoryItem.ExecuteAsync();
        }
    }
}
