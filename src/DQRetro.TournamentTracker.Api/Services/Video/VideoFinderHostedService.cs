using System.Runtime;
using DQRetro.TournamentTracker.Api.Services.Video.Interfaces;

namespace DQRetro.TournamentTracker.Api.Services.Video;

/// <summary>
/// Hosted service for finding new YouTube Videos for tracked channels.
/// </summary>
public sealed class VideoFinderHostedService : IHostedService
{
    private static CancellationTokenSource _cancellationTokenSource;
    private readonly ILogger<VideoFinderHostedService> _logger;
    private readonly IServiceScopeFactory _serviceScopeFactory;

    /// <summary>
    /// Ctor.
    /// </summary>
    /// <param name="logger"></param>
    /// <param name="serviceScopeFactory"></param>
    public VideoFinderHostedService(ILogger<VideoFinderHostedService> logger, IServiceScopeFactory serviceScopeFactory)
    {
        _logger = logger;
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
            _logger.LogInformation("{ServiceName} is ensuring videos are up-to-date", nameof(VideoFinderHostedService));

            try
            {
                // ServiceScopeFactory is required here, as VideoService is scoped.
                using (IServiceScope scope = _serviceScopeFactory.CreateScope())
                {
                    IVideoService videoService = scope.ServiceProvider.GetRequiredService<IVideoService>();
                    await videoService.FindAndInsertNewVideosAsync();
                }

                _logger.LogInformation("{ServiceName} has ensured all videos are up-to-date", nameof(VideoFinderHostedService));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "{ServiceName} failed to find new videos. Faulted with {ErrorMessage}", nameof(VideoFinderHostedService), ex.Message);
            }

            // This isn't ideal, but YouTube's JSON payloads that are parsed by the YouTubeExplode library are massive.
            // The result of this is LOH allocations, which aren't automatically compacted.
            // The server won't have too much available RAM, so I'd rather force an aggressive GC run to ensure
            // the other background jobs, and requests have sufficient RAM available, at the cost of a short-term freeze-up.
            GCSettings.LargeObjectHeapCompactionMode = GCLargeObjectHeapCompactionMode.CompactOnce;
            GC.Collect(2, GCCollectionMode.Forced, blocking: true, compacting: true);
            GCSettings.LargeObjectHeapCompactionMode = GCLargeObjectHeapCompactionMode.CompactOnce;

            _logger.LogInformation("{ServiceName} will wait 1 day before checking again", nameof(VideoFinderHostedService));

            // TODO: Change this to periodically check when the last job was executed from the DB!
            // This would reduce the total wait time, and remove duplicate runs on start-up.
            await Task.Delay(TimeSpan.FromDays(1), cancellationToken);
        }
    }
}
