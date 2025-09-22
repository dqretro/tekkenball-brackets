using System.Runtime;
using DQRetro.TournamentTracker.Api.Extensions;
using DQRetro.TournamentTracker.Api.Persistence.Database;

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

        // TODO: ADD RATE LIMITING!

        builder.Services.AddCommonServices(builder.Configuration)
                        .AddVideoServices()
                        .AddDatabaseMigrations(isDevelopment)
                        .ConfigureForwardedHeaders(builder.Configuration, isDevelopment)
                        .AddCustomCors(builder.Configuration)
                        .AddCustomSwagger(isDevelopment, port)
                        .AddControllersWithCustomSerialization();


        WebApplication app = builder.Build();

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

}
