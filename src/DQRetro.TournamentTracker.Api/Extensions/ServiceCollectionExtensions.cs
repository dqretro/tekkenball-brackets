using System.Net;
using System.Text.Json;
using System.Text.Json.Serialization;
using DQRetro.TournamentTracker.Api.Models.Configuration;
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
            // TODO: Verify if using All is necessary here, as we likely only need X-Forwarded-For.
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
    /// Configures common services used throughout the application. TODO: MORE DESCRIPTIVE DESCRIPTION!
    /// </summary>
    /// <param name="services"></param>
    /// <param name="configuration"></param>
    /// <returns></returns>
    public static IServiceCollection AddCommonServices(this IServiceCollection services, IConfiguration configuration)
    {
        services.Configure<KeysConfiguration>(configuration.GetRequiredSection(KeysConfiguration.SectionKey));
        
        services.AddSingleton<IDateTimeProvider, DateTimeProvider>() // TODO: REPLACE DateTimeProvider with a more modern and more appropriate alternative!
                .AddMemoryCache()
                .AddSingleton<ICacheService, CacheService>()
                .AddHttpContextAccessor();
        
        return services;
    }
    
    /// <summary>
    /// Configures Swagger to run on the specified port, if running on a development environment.
    /// The API is only designed to be consumable from the UI.  Therefore, Swagger should only be enabled in Dev, not Prod. 
    /// </summary>
    /// <param name="services"></param>
    /// <param name="isDevelopment"></param>
    /// <param name="port"></param>
    /// <returns></returns>
    public static IServiceCollection AddCustomSwagger(this IServiceCollection services, bool isDevelopment, int port)
    {
        if (!isDevelopment)
        {
            return services;
        }
        
        services.AddEndpointsApiExplorer();
        services.AddSwaggerGen(options =>
        {
            options.SwaggerDoc("v1", new OpenApiInfo
            {
                Title = "My API",
                Version = "v1"
            });
            
            options.AddServer(new OpenApiServer
            {
                Url = $"http://localhost:{port}"
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
        // TODO: Need to add the actual site, and any of Sky's development locations into appsettings.
        // TODO: Need to determine how auth will work (if we even implement account/auth) (as this will require AllowCredentials, which I have preemptively added.
        // TODO: Need to determine the security of AllowAnyMethod/AllowAnyHeader.
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
                    options.JsonSerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull;
                });

        return services;
    }
}
