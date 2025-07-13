function extractPlaylistId(url) {
  const match = url.match(/playlist\/([a-zA-Z0-9]+)(\?|$)/);
  return match ? match[1] : null;
}

export const spotifyRequest = {
  async getPlaylistTracks(accessToken, playlistUrl) {
    const playlistId = extractPlaylistId(playlistUrl);
    const url = `https://api.spotify.com/v1/playlists/${playlistId}/tracks`;

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch playlist tracks: ${response.status}`);
    }

    const data = await response.json();
    return data.items;
  }
}