using DQRetro.TournamentTracker.Api.Services.Video.Interfaces;

namespace DQRetro.TournamentTracker.Api.Services.Video;

/// <summary>
/// Hosted service for finding new YouTube Videos for tracked channels.
/// </summary>
public sealed class VideoFinderHostedService : IHostedService
{
    private static CancellationTokenSource _cancellationTokenSource;
    private readonly IServiceScopeFactory _serviceScopeFactory;

    /// <summary>
    /// Ctor.
    /// </summary>
    /// <param name="serviceScopeFactory"></param>
    public VideoFinderHostedService(IServiceScopeFactory serviceScopeFactory)
    {
        _serviceScopeFactory = serviceScopeFactory;
    }

    /// <summary>
    /// Automatically called to start the hosted service.
    /// </summary>
    /// <param name="cancellationToken"></param>
    /// <returns></returns>
    public Task StartAsync(CancellationToken cancellationToken)
    {
        _cancellationTokenSource = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
        Task.Run(() => UpdateAsync(_cancellationTokenSource.Token), _cancellationTokenSource.Token);
        return Task.CompletedTask;
    }

    /// <summary>
    /// Automatically called upon application shutdown.
    /// </summary>
    /// <param name="cancellationToken"></param>
    /// <returns></returns>
    public Task StopAsync(CancellationToken cancellationToken)
    {
        _cancellationTokenSource?.Cancel();
        return Task.CompletedTask;
    }

    private async Task UpdateAsync(CancellationToken cancellationToken)
    {
        while (!cancellationToken.IsCancellationRequested)
        {
            // TODO: REPLACE CONSOLE WRITELINES WITH LOGGER CALLS!
            Console.WriteLine("Finding new videos...");

            try
            {
                // ServiceScopeFactory is required here, as VideoService is scoped.
                using (IServiceScope scope = _serviceScopeFactory.CreateScope())
                {
                    IVideoService videoService = scope.ServiceProvider.GetRequiredService<IVideoService>();
                    await videoService.FindAndInsertNewVideosAsync();
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Failed to find new videos: {ex.Message}");
            }

            Console.WriteLine("Finished finding new videos. Waiting 1 day.");

            // TODO: Change this to periodically check when the last job was executed from the DB!
            // This would reduce the total wait time.
            await Task.Delay(TimeSpan.FromDays(1), cancellationToken);
        }
    }
}
