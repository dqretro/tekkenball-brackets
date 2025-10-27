using System.Runtime;
using DQRetro.TournamentTracker.Api.Extensions;
using DQRetro.TournamentTracker.Api.Middleware;
using NLog;
using NLog.Web;

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

        builder.Logging.ClearProviders();
        LogManager.Setup().LoadConfigurationFromFile("NLog.config");
        builder.Host.UseNLog();

        builder.WebHost.ConfigureKestrel(kestrelServerOptions =>
        {
            kestrelServerOptions.Configure(builder.Configuration.GetRequiredSection("Kestrel"));
            kestrelServerOptions.AddServerHeader = false;
        });

        bool isDevelopment = builder.Environment.IsDevelopment();
        string hostname = Environment.MachineName;

        builder.Configuration.AddJsonFile("appsettings.json", optional: false, reloadOnChange: false);
        builder.Configuration.AddJsonFile("appsettings.Secrets.json", optional: false, reloadOnChange: false);

        builder.Services.AddCommonServices(builder.Configuration)
                        .AddVideoServices()
                        .AddDatabaseMigrations(isDevelopment)
                        .ConfigureForwardedHeaders(builder.Configuration, isDevelopment)
                        .AddCustomCors(builder.Configuration)
                        .AddTokenBucketRateLimiter()
                        .AddCustomSwagger(builder.Configuration, isDevelopment)
                        .AddControllersWithCustomSerialization()
                        .AddCustomOpenTelemetry(builder.Configuration, hostname);


        WebApplication app = builder.Build();

        app.UseMiddleware<ExceptionHandlerMiddleware>();
        app.UseForwardedHeaders();
        app.UseCors();
        app.UseRateLimiter();
        app.UseAuthentication();
        app.UseAuthorization();
        app.MapControllers();
        app.UseCustomSwagger(isDevelopment);

        app.Services.GetRequiredService<ILogger<Program>>()
                    .LogWarning("Startup complete\n" +
                                "ServerGc: {IsServerGc}\n" +
                                "LohCompationMode: {LohCompactionMode}\n" +
                                "IsDevelopment: {IsDevelopment}\n" +
                                "ProcessId: {ProcessId}\n" +
                                "Hostname: {Hostname}",
                                GCSettings.IsServerGC,
                                GCSettings.LargeObjectHeapCompactionMode,
                                isDevelopment,
                                Environment.ProcessId,
                                hostname);
        await app.RunAsync();
    }
}
