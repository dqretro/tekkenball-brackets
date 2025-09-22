using System.Net;
using System.Text.Json;
using DQRetro.TournamentTracker.Api.Models.Configuration;
using DQRetro.TournamentTracker.Api.Persistence.Database;
using DQRetro.TournamentTracker.Api.Persistence.Database.Interfaces;
using DQRetro.TournamentTracker.Api.Persistence.YouTube;
using DQRetro.TournamentTracker.Api.Persistence.YouTube.Interfaces;
using DQRetro.TournamentTracker.Api.Services.DbMigration;
using DQRetro.TournamentTracker.Api.Services.Video;
using DQRetro.TournamentTracker.Api.Services.Video.Interfaces;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.OpenApi.Models;

namespace DQRetro.TournamentTracker.Api.Extensions;

/// <summary>
/// A collection of extension methods to be used on IServiceCollection to reduce clutter in Program.cs
/// </summary>
public static class ServiceCollectionExtensions
{
    /// <summary>
    /// Configures DI to handle reverse proxies behind Apache, Nginx, etc.
    /// This is required as reverse proxies will re-write the request's IP Address header, we want the API to see the original IP Address.
    /// This will only be enabled in Prod, not Dev environments.
    /// </summary>
    /// <param name="services"></param>
    /// <param name="configuration"></param>
    /// <param name="isDevelopment"></param>
    /// <returns></returns>
    public static IServiceCollection ConfigureForwardedHeaders(this IServiceCollection services, IConfiguration configuration, bool isDevelopment)
    {
        if (isDevelopment)
        {
            return services;
        }

        services.Configure<ForwardedHeadersOptions>(options =>
        {
            options.ForwardedHeaders = ForwardedHeaders.All;

            string reverseProxyIpAddress = configuration.GetRequiredSection("ForwardedHeaderOptions:ReverseProxyIpAddress").Get<string>();
            options.KnownProxies.Clear();
            options.KnownProxies.Add(IPAddress.Parse(reverseProxyIpAddress));

            // The same as above can be done for "KnownNetworks" if I ever decide to split this into a separate device handling the reverse proxy.

            string allowedHost = configuration.GetRequiredSection("ForwardedHeaderOptions:AllowedHost").Get<string>();
            options.AllowedHosts.Clear();
            options.AllowedHosts.Add(allowedHost);
        });

        return services;
    }

    /// <summary>
    /// Configures common or shared services used throughout the application.
    /// </summary>
    /// <param name="services"></param>
    /// <param name="configuration"></param>
    /// <returns></returns>
    public static IServiceCollection AddCommonServices(this IServiceCollection services, IConfiguration configuration)
    {
        ThrowIfKeysNotSet(configuration);
        services.Configure<KeysConfiguration>(configuration.GetRequiredSection(KeysConfiguration.SectionKey));

        // Can unit test 'TimeProvider' using Microsoft.Extensions.TimeProvider.Testing package.  Using this to avoid a custom DateTimeProvider abstraction.
        services.AddSingleton(TimeProvider.System);

        return services;
    }

    public static IServiceCollection AddVideoServices(this IServiceCollection services)
    {
        services.AddScoped<IYouTubeRepository, YouTubeExplodeRepository>()
                .AddScoped<IVideoSqlRepository, VideoSqlRepository>()
                .AddScoped<IVideoService, VideoService>()
                .AddHostedService<VideoFinderHostedService>();

        return services;
    }

    /// <summary>
    /// Configures Swagger to run on the specified port, if running on a development environment.
    /// The API is only designed to be consumable from the UI.  Therefore, Swagger should only be enabled in Dev, not Prod.
    /// </summary>
    /// <param name="services"></param>
    /// <param name="configuration"></param>
    /// <param name="isDevelopment"></param>
    /// <returns></returns>
    public static IServiceCollection AddCustomSwagger(this IServiceCollection services, IConfiguration configuration, bool isDevelopment)
    {
        string kestrelUrl = configuration.GetValue<string>("Kestrel:Endpoints:Http:Url");

        if (!isDevelopment)
        {
            return services;
        }

        services.AddEndpointsApiExplorer();
        services.AddSwaggerGen(options =>
        {
            options.SwaggerDoc("v1", new OpenApiInfo
            {
                Title = "DQRetro Tournament Tracker API",
                Version = "v1"
            });

            options.AddServer(new OpenApiServer
            {
                Url = kestrelUrl
            });
        });

        return services;
    }

    /// <summary>
    /// Configures CORS to allow requests between this API, and the Site which must be running on one of the values specified in appsettings.json -> Cors -> AllowedOrigins.
    /// </summary>
    /// <param name="services"></param>
    /// <param name="configuration"></param>
    /// <returns></returns>
    public static IServiceCollection AddCustomCors(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddCors(options =>
        {
            options.AddDefaultPolicy(policyBuilder =>
            {
                string[] allowedOrigins = configuration.GetRequiredSection("Cors:AllowedOrigins").Get<string[]>();

                policyBuilder.WithOrigins(allowedOrigins)
                             .AllowAnyMethod()
                             .AllowAnyHeader()
                             .AllowCredentials();
            });
        });

        return services;
    }

    /// <summary>
    /// Configures Controllers with custom serialization (snake-case) and ignoring null values (reduce unnecessary bandwidth consumption).
    /// </summary>
    /// <param name="services"></param>
    /// <returns></returns>
    public static IServiceCollection AddControllersWithCustomSerialization(this IServiceCollection services)
    {
        services.AddControllers()
                .AddJsonOptions(options =>
                {
                    options.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower;
                });

        return services;
    }

    /// <summary>
    /// Adds the database migrations background service to execute any outstanding migrations.
    /// Only runs if we are not in development mode.
    /// </summary>
    /// <param name="services"></param>
    /// <param name="isDevelopment"></param>
    /// <returns></returns>
    public static IServiceCollection AddDatabaseMigrations(this IServiceCollection services, bool isDevelopment)
    {
        if (!isDevelopment)
        {
            services.AddHostedService<DbMigrationBackgroundService>();
        }

        return services;
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
