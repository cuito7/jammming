const clientID = '1b7a8f3dac1d478d8119b1fdddec3d65'
const redirectURI = 'http://localhost:3000/'
let accessToken;
const Spotify = {
  getAccessToken() {
    if (accessToken) {
      return accessToken;
    }

    let accessTokenMatch = window.location.href.match(/access_token=([^&]*)/);
    let expiresInMatch = window.location.href.match(/expires_in=([^&]*)/);

    if (accessTokenMatch && expiresInMatch) {
      accessToken = accessTokenMatch[1];
      let expiresIn = Number(expiresInMatch[1]);
      window.setTimeout(() => accessToken = '', expiresIn * 1000);
      window.history.pushState('Access Token', null, '/');
      return accessToken;
    } else {
      window.location = `https://accounts.spotify.com/authorize?client_id=${clientID}&response_type=token&scope=playlist-modify-public&redirect_uri=${redirectURI}`
    }
  },
  search(term) {
    const accessToken = Spotify.getAccessToken();
    return fetch(`https://api.spotify.com/v1/search?type=track&q=${term}`, {
      headers: {Authorization: `Bearer ${accessToken}`}
    }).then(response => {
      return response.json();
    }).then(jsonResponse => {
      if (!jsonResponse.tracks){
        return [];
      }
      return jsonResponse.tracks.items.map(track => ({
        id: track.id,
        name: track.name,
        artist: track.artists[0].name,
        album: track.album.name,
        uri: track.uri
      }));
    });
  },
  savePlaylist(playlistName, trackURIs) {
    if (!playlistName || !trackURIs.length) {
      return;
    }

    let accessToken = Spotify.getAccessToken();
    let headers = {Authorization: `Bearer ${accessToken}`};
    let headersExpanded = {Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json'};
    let userID;
    let playlistID;

    fetch('https://api.spotify.com/v1/me', {
      headers: headers
    }).then(response => {
      return response.json();
    }).then(jsonResponse => {
      userID = jsonResponse.id;

      return fetch(`https://api.spotify.com/v1/users/${userID}/playlists`, {
        headers: headersExpanded,
        body: JSON.stringify({name: playlistName}),
        method: 'POST'
      }).then(response => {
        return response.json();
      }).then(jsonResponse => {
        playlistID = jsonResponse.id;

        return fetch(`https://api.spotify.com/v1/users/${userID}/playlists/${playlistID}/tracks`, {
          headers: headersExpanded,
          body: JSON.stringify({uris: trackURIs}),
          method: 'POST'
        });
      });
    });
  }
};

export default Spotify;