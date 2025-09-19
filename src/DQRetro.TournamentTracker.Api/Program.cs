using System.Runtime;
using DQRetro.TournamentTracker.Api.Extensions;
using DQRetro.TournamentTracker.Api.Persistence.Database;
using DQRetro.TournamentTracker.Api.Persistence.StartGg;
using DQRetro.TournamentTracker.Api.Services.StartGg;

namespace DQRetro.TournamentTracker.Api;

/// <summary>
/// Class for application's entrypoint.
/// </summary>
public class Program
{
    /// <summary>
    /// Method for the application's entrypoint.
    /// Handles DI and Running the API.
    /// </summary>
    /// <param name="args">CLI args passed into the executable/dotnet CLI.</param>
    public static async Task Main(string[] args)
    {
        const ulong gcHardLimitBytes = (ulong)200 * 1024 * 1024; // 200MB
        AppContext.SetData("GCHeapHardLimit", gcHardLimitBytes);
        GC.RefreshMemoryLimit();
        GCSettings.LargeObjectHeapCompactionMode = GCLargeObjectHeapCompactionMode.CompactOnce;


        WebApplicationBuilder builder = WebApplication.CreateBuilder(args);

        // TODO: Change the port to be configurable...
        const int port = 5002;
        bool isDevelopment = builder.Environment.IsDevelopment();

        builder.Configuration.AddJsonFile("appsettings.json", optional: false, reloadOnChange: false);
        builder.Configuration.AddJsonFile("appsettings.Secrets.json", optional: false, reloadOnChange: false);

        ThrowIfKeysNotSet(builder.Configuration);

        // TODO: ADD RATE LIMITING!

        builder.Services.AddCommonServices(builder.Configuration)
                        .AddVideoServices()
                        .AddDatabaseMigrations(isDevelopment)
                        .ConfigureForwardedHeaders(builder.Configuration, isDevelopment)
                        .AddCustomCors(builder.Configuration)
                        .AddCustomSwagger(isDevelopment, port)
                        .AddControllersWithCustomSerialization();

        WebApplication app = builder.Build();

        // Use the following for testing X-Forwarded-For (comes before the ForwardedHeaders middleware):
        // app.Use(async (context, next) =>
        // {
        //     // Spoof RemoteIpAddress
        //     context.Connection.RemoteIpAddress = IPAddress.Parse("10.0.0.2");
        //
        //     await next();
        // });

        app.UseForwardedHeaders();
        app.UseCors();
        // app.UseHttpsRedirection();
        app.UseAuthentication();
        app.UseAuthorization();
        app.MapControllers();
        app.UseCustomSwagger(isDevelopment);
        
        app.Services.GetRequiredService<ILogger<Program>>()
                    .LogInformation("Startup complete\n" +
                                    "ServerGc: {IsServerGc}\n" +
                                    "LohCompationMode: {LohCompactionMode}\n" +
                                    "IsDevelopment: {IsDevelopment}\n" +
                                    "ProcessId: {ProcessId}",
                                    GCSettings.IsServerGC,
                                    GCSettings.LargeObjectHeapCompactionMode,
                                    isDevelopment,
                                    Environment.ProcessId);
        await app.RunAsync();
    }

    private static void ThrowIfKeysNotSet(IConfiguration configuration)
    {
        const string startGgApiKeySectionKey = "Keys:StartGgApiKey";
        const string startGgApiKeyPlaceholder = "DO NOT COMMIT THIS FILE WITH THIS PROPERTY POPULATED WITH AN ACTUAL KEY!";

        string startGgApiKey = configuration[startGgApiKeySectionKey];
        if (string.IsNullOrEmpty(startGgApiKey) || startGgApiKey == startGgApiKeyPlaceholder)
        {
            throw new Exception("StartGG API Key was not set. The application cannot start without this. Exiting.");
        }

        const string sqlConnectionStringSectionKey = "Keys:SqlConnectionString";
        const string sqlConnectionStringPlaceholder = "DO NOT COMMIT THIS FILE WITH THIS PROPERTY POPULATED WITH AN ACTUAL CONNECTION STRING!";

        string sqlConnectionString = configuration[sqlConnectionStringSectionKey];
        if (string.IsNullOrEmpty(sqlConnectionString) || sqlConnectionString == sqlConnectionStringPlaceholder)
        {
            throw new Exception("SQL Connection String was not set. The application cannot start without this. Exiting.");
        }
    }
}
