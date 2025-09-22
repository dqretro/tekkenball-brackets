using System.ComponentModel.DataAnnotations;
using DQRetro.TournamentTracker.Api.Extensions;
using DQRetro.TournamentTracker.Api.Models.Common;
using Microsoft.Data.SqlClient;

namespace DQRetro.TournamentTracker.Api.Middleware;

public class ExceptionHandlerMiddleware
{
    private readonly ILogger<ExceptionHandlerMiddleware> _logger;
    private readonly RequestDelegate _next;

    public ExceptionHandlerMiddleware(ILogger<ExceptionHandlerMiddleware> logger, RequestDelegate next)
    {
        _logger = logger;
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            Code errorCode;

            switch (ex)
            {
                case ValidationException:
                    errorCode = Code.InputValidationFailed;
                    break;
                case OperationCanceledException _ when context.RequestAborted.IsCancellationRequested:
                case TimeoutException:
                    errorCode = Code.TimeoutError;
                    break;
                case SqlException:
                    errorCode = Code.SqlError;
                    break;
                default:
                    errorCode = Code.UnknownError;
                    break;
            }

            Error error = ResultExtensions.GetError(errorCode);

            _logger.LogWarning(error.Code, ex, "An exception was thrown: {ErrorMessage} {ExceptionMessage}", error.Message, ex.Message);
            await context.Response.WriteAsJsonAsync(error);
        }
    }
}
