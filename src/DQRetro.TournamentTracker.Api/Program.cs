using System.Net;
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

        // TODO: ADD RATE LIMITING!
        
        builder.Services.AddCommonServices(builder.Configuration)
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
        
        await app.RunAsync();
    }
}
