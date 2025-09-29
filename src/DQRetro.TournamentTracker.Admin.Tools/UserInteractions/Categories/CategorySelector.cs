namespace DQRetro.TournamentTracker.Admin.Tools.UserInteractions.Categories;

/// <summary>
/// Selects a given category, allowing category items to be selected and executed.
/// </summary>
public sealed class CategorySelector
{
    private readonly IReadOnlyDictionary<byte, ICategoryItemSelector> _categories;
    private readonly List<string> _categoryDescriptions;
    private readonly byte _exitOption;

    /// <summary>
    /// Ctor.
    /// </summary>
    /// <param name="categories"></param>
    public CategorySelector(IReadOnlyDictionary<byte, ICategoryItemSelector> categories)
    {
        _categories = categories;
        _categoryDescriptions = _categories.Select(kvp => $"{kvp.Key} - {kvp.Value.Description}").ToList();
        _exitOption = (byte)(_categories.Count + 1);
        _categoryDescriptions.Add($"{_exitOption} - Go Back");
    }

    /// <summary>
    /// Selects and executes a category from the built-up and provided list.
    /// </summary>
    public async Task SelectCategoryAsync()
    {
        while (true)
        {
            Console.WriteLine("Available Categories:\n");
            Console.WriteLine(string.Join('\n', _categoryDescriptions));

            string userInput = Console.ReadLine();
            if (!byte.TryParse(userInput, out byte userInputByte) || userInputByte < 1 || userInputByte > _exitOption)
            {
                Console.WriteLine("Error: Input could not be parsed. Try again.");
                continue;
            }
            else if (userInputByte == _exitOption)
            {
                return;
            }

            ICategoryItemSelector categoryItemSelector = _categories[userInputByte];
            await categoryItemSelector.SelectAndExecuteCategoryItemAsync();
        }
    }
}
