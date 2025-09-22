using DQRetro.TournamentTracker.Api.Models.Common;

namespace DQRetro.TournamentTracker.Api.Extensions;

public static class ResultExtensions
{
    public static Error GetError(Code? code)
    {
        return new Error
        {
            Code = (int)code!.Value,
            Message = GetMessage(code)
        };
    }

    private static string GetMessage(Code? code)
    {
        const string unknownErrorMessage = "An unknown error has occurred.";
        const string inputValidationFailedMessage = "One or more inputs were outside the allowed range, or were empty.";
        const string noResultsFoundMessage = "No results were found for the requested resource.";
        const string insufficientPermissionsMessage = "You do not have sufficient permissions to access the requested resource.";
        const string timeoutErrorMessage = "Unable to access the requested resource in the allotted time frame.";
        const string sqlErrorMessage = "Unable to query the database.";
        const string featureNotImplementedMessage = "The requested feature has not been implemented.";

        return code switch
        {
            Code.UnknownError => unknownErrorMessage,
            Code.InputValidationFailed => inputValidationFailedMessage,
            Code.NoResultsFound => noResultsFoundMessage,
            Code.InsufficientPermissions => insufficientPermissionsMessage,
            Code.TimeoutError => timeoutErrorMessage,
            Code.SqlError => sqlErrorMessage,
            Code.FeatureNotImplemented => featureNotImplementedMessage,
            _ => unknownErrorMessage
        };
    }

    public static int GetHttpResponseCode(Code? code)
    {
        return code switch
        {
            Code.UnknownError => StatusCodes.Status500InternalServerError,
            Code.InputValidationFailed => StatusCodes.Status400BadRequest,
            Code.NoResultsFound => StatusCodes.Status404NotFound,
            Code.InsufficientPermissions => StatusCodes.Status403Forbidden,
            Code.TimeoutError => StatusCodes.Status408RequestTimeout,
            Code.SqlError => StatusCodes.Status500InternalServerError,
            Code.FeatureNotImplemented => StatusCodes.Status400BadRequest,
            _ => StatusCodes.Status500InternalServerError
        };
    }
}
