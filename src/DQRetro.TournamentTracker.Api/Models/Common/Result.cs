using DQRetro.TournamentTracker.Api.Extensions;

namespace DQRetro.TournamentTracker.Api.Models.Common;

public sealed class Result
{
    private Result(bool succeeded, Code? code = null, Error error = null, int? httpStatusCode = null)
    {
        Succeeded = succeeded;
        Code = code;

        if (!succeeded)
        {
            if (error is not null && httpStatusCode is not null)
            {
                HttpResponseCode = httpStatusCode.Value;
                Error = error;
            }
            else
            {
                HttpResponseCode = ResultExtensions.GetHttpResponseCode(code);
                Error = ResultExtensions.GetError(code ?? Common.Code.UnknownError);
            }
        }
        else
        {
            HttpResponseCode = StatusCodes.Status200OK;
        }
    }

    public bool Succeeded { get; private set; }
    public Code? Code { get; private set; }
    public int HttpResponseCode { get; private set; }
    public Error Error { get; private set; }

    public static Result Success(Code? code = null) => new(true, code);
    public static Result Failure(Code code) => new(false, code);
    public static Result Failure(Error error, int httpStatusCode) => new(false, null, error, httpStatusCode);
}

public sealed class Result<TSuccess> where TSuccess : class
{
    private Result(TSuccess successResult, bool succeeded, Code? code = null, Error error = null, int? httpStatusCode = null)
    {
        Succeeded = succeeded;
        SuccessResult = successResult;
        Code = code;

        if (!succeeded)
        {
            if (error is not null && httpStatusCode is not null)
            {
                HttpResponseCode = httpStatusCode.Value;
                Error = error;
            }
            else
            {
                HttpResponseCode = ResultExtensions.GetHttpResponseCode(code);
                Error = ResultExtensions.GetError(code ?? Common.Code.UnknownError);
            }
        }
        else
        {
            HttpResponseCode = StatusCodes.Status200OK;
        }
    }

    public TSuccess SuccessResult { get; private set; }
    public bool Succeeded { get; private set; }
    public Code? Code { get; private set; }
    public int HttpResponseCode { get; private set; }
    public Error Error { get; private set; }

    public static Result<TSuccess> Success(TSuccess successResult, Code? code = null) => new(successResult, true, code);
    public static Result<TSuccess> Failure(Code code) => new(null, false, code);
    public static Result<TSuccess> Failure(Error error, int httpStatusCode) => new(null, false, null, error, httpStatusCode);
}
