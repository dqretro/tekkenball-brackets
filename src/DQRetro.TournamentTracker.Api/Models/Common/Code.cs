namespace DQRetro.TournamentTracker.Api.Models.Common;

public enum Code
{
    #region Generic Errors (0-10):
    UnknownError = 0,
    InputValidationFailed = 1,
    NoResultsFound = 2,
    InsufficientPermissions = 3,
    TimeoutError = 4,
    SqlError = 5,
    FeatureNotImplemented = 6,
    RateLimitExceeded = 7,
    #endregion
}
