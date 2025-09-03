using DQRetro.TournamentTracker.Extensions;
using DQRetro.TournamentTracker.Models.Configuration;

var builder = WebApplication.CreateBuilder(args);

// TODO: Change this to be configurable...
const int port = 5002;
bool isDevelopment = builder.Environment.IsDevelopment();

builder.Configuration.AddJsonFile("appsettings.json", optional: false, reloadOnChange: false);
builder.Configuration.AddJsonFile("appsettings.Secrets.json", optional: false, reloadOnChange: false);

builder.Services.AddCustomSwagger(isDevelopment, port);

builder.Services.Configure<KeysConfiguration>(builder.Configuration.GetRequiredSection(KeysConfiguration.SectionKey));

var app = builder.Build();

// Configure the HTTP request pipeline.
app.UseCustomSwagger(isDevelopment);

app.UseHttpsRedirection();

var summaries = new[]
{
    "Freezing", "Bracing", "Chilly", "Cool", "Mild", "Warm", "Balmy", "Hot", "Sweltering", "Scorching"
};

app.MapGet("/weatherforecast", () =>
    {
        var forecast = Enumerable.Range(1, 5).Select(index =>
                new WeatherForecast
                (
                    DateOnly.FromDateTime(DateTime.Now.AddDays(index)),
                    Random.Shared.Next(-20, 55),
                    summaries[Random.Shared.Next(summaries.Length)]
                ))
            .ToArray();
        return forecast;
    })
    .WithName("GetWeatherForecast");

app.Run();

record WeatherForecast(DateOnly Date, int TemperatureC, string? Summary)
{
    public int TemperatureF => 32 + (int)(TemperatureC / 0.5556);
}