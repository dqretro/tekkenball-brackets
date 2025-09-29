namespace DQRetro.TournamentTracker.Admin.Tools.UserInteractions.Categories;

/// <summary>
/// Represents a given Category Item within a Category.
/// </summary>
public interface ICategoryItem
{
    /// <summary>
    /// The description to be displayed to the user for a given action.
    /// </summary>
    string Description { get; }

    /// <summary>
    /// Executes the selected CategoryItem.
    /// </summary>
    /// <returns></returns>
    Task ExecuteAsync();
}
