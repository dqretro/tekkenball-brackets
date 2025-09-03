using DQRetro.TournamentTracker.Api.Extensions;
using DQRetro.TournamentTracker.Api.Models.Configuration;

namespace DQRetro.TournamentTracker.Api;

public class Program
{
    public static async Task Main(string[] args)
    {
        WebApplicationBuilder builder = WebApplication.CreateBuilder(args);

        // TODO: Change the port to be configurable...
        const int port = 5002;
        bool isDevelopment = builder.Environment.IsDevelopment();

        builder.Configuration.AddJsonFile("appsettings.json", optional: false, reloadOnChange: false);
        builder.Configuration.AddJsonFile("appsettings.Secrets.json", optional: false, reloadOnChange: false);

        builder.Services.AddCommonServices(builder.Configuration)
                        .AddCustomCors(builder.Configuration)
                        .AddCustomSwagger(isDevelopment, port)
                        .AddControllersWithCustomSerialization();

        WebApplication app = builder.Build();
        
        app.UseCors()
           .UseHttpsRedirection()
           .UseAuthentication()
           .UseAuthorization()
           .MapControllers() // Wtf? Why isn't this on IApplicationBuilder?  May require a separate call to: app.MapControllers();
           .UseCustomSwagger(isDevelopment);
        
        await app.RunAsync();
    }
}
