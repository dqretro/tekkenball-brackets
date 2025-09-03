using Microsoft.OpenApi.Models;

namespace DQRetro.TournamentTracker.Extensions;

/// <summary>
/// A collection of extension methods to be used on IServiceCollection to reduce clutter in Program.cs
/// </summary>
public static class ServiceCollectionExtensions
{
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
}
