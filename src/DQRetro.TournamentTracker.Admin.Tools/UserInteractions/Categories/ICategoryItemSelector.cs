namespace DQRetro.TournamentTracker.Admin.Tools.UserInteractions.Categories;

/// <summary>
/// Selects a given category, allowing category items to be selected and executed.
/// </summary>
public interface ICategoryItemSelector
{
    /// <summary>
    /// The description to be displayed to the user for a given category.
    /// </summary>
    string Description { get; }

    /// <summary>
    /// Allows the user to select a CategoryItem and executes it.
    /// </summary>
    /// <returns></returns>
    Task SelectAndExecuteCategoryItemAsync();
}
