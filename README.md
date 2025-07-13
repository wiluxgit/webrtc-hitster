# WebRTC Hitster
Proof of concept program for a P2P multiplayer game using WebRTC and WebTorrent.

Open [wiluxgit.github.io/webrtc-hitster](https://wiluxgit.github.io/webrtc-hitster) to generate a random room and the share the room link with your friends!

The game *probably* does not work if all connected users are under [Symmetric NAT](https://networkengineering.stackexchange.com/questions/67218/why-is-symmetric-nat-called-symmetric). But if at least one user isn't, the game should just work.

# Build & Deploy
This is a static site, it has no build proccess. Any dependencies are included directly using `<script>` tags.


## Spotify Auth
This repo uses the [Spotify API authenticated with PKCE](https://developer.spotify.com/documentation/web-api/tutorials/code-pkce-flow) to fetch playlists and audio snippets. The site configuration for this is stored in `env.mjs`.

In order to deploy this repo elsewhere you must change this to your own `clientId` as the one in the repo can only authenticatate <https://wiluxgit.github.io/webrtc-hitster/index.html>. You can create and configure your own `clientId` through the [Spotify developer dashboard](https://developer.spotify.com/dashboard/).