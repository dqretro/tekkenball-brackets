namespace DQRetro.TournamentTracker.Api.Extensions;

/// <summary>
/// A collection of extension methods to be used on IApplicationBuilder to reduce clutter in Program.cs
/// </summary>
public static class ApplicationBuilderExtensions
{
    /// <summary>
    /// Configures Swagger to run, if running on a development environment.
    /// The API is only designed to be consumable from the UI.  Therefore, Swagger should only be enabled in Dev, not Prod. 
    /// </summary>
    /// <param name="app"></param>
    /// <param name="isDevelopment"></param>
    /// <returns></returns>
    public static IApplicationBuilder UseCustomSwagger(this IApplicationBuilder app, bool isDevelopment)
    {
        if (!isDevelopment)
        {
            return app;
        }
        
        app.UseSwagger();
        app.UseSwaggerUI(options =>
        {
            options.SwaggerEndpoint("/swagger/v1/swagger.json", "My API V1");
        });

        return app;
    }
}
