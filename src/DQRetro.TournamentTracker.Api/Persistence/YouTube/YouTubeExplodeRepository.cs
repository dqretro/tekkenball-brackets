using DQRetro.TournamentTracker.Api.Models.Database.DTOs;
using DQRetro.TournamentTracker.Api.Persistence.YouTube.Interfaces;
using YoutubeExplode;
using YoutubeExplode.Channels;
using YoutubeExplode.Playlists;

namespace DQRetro.TournamentTracker.Api.Persistence.YouTube;

/// <summary>
/// Concrete implementation of YouTubeExplode Repository.
/// </summary>
public sealed class YouTubeExplodeRepository : IYouTubeRepository
{
    // Not using YouTubeClient at a class-level, as it's memory inefficient and I want it to be collected ASAP to reduce memory pressure.

    public async Task<IEnumerable<InsertEventVideo>> GetPlaylistVideosByChannelIdAsync(string channelId)
    {
        ChannelId channel = ChannelId.Parse(channelId);
        YoutubeClient youTubeClient = new();

        List<InsertEventVideo> videos = [];

        await foreach (PlaylistVideo playlistVideo in youTubeClient.Channels.GetUploadsAsync(channel))
        {
            videos.Add(new InsertEventVideo
            {
                YouTubeChannelId = playlistVideo.Author.ChannelId,
                YouTubeChannelName = playlistVideo.Author.ChannelTitle,
                EventId = null,
                Title = playlistVideo.Title,
                YouTubeVideoId = playlistVideo.Id,
                YouTubeVideoUrl = playlistVideo.Url,
                YouTubeVideoThumbnailUrl = playlistVideo.Thumbnails.MaxBy(thumbnail => thumbnail.Resolution.Width * thumbnail.Resolution.Height).Url,
                ReleaseDate = null
            });
        }

        return videos;
    }
}
