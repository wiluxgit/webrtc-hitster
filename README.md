# WebRTC Hitster
Proof of concept program for a serverless multiplayer game using WebRTC and WebTorrent.

The game probable does not work if all ends of a connection are under symmetric NAT, but if at least one isn't it should work.

# How does it work?
In order to P2P over WebRTC it is needed for `A` to send `B` an `offer` and after which `B` send `A` and accept. Normally this requires some signaling server but we offload that to WebTorrent trackers to do it for us.

We use the room ID to create magnet links and seed dummy data.
The actual game data will be transfered inbetween seeders using extended ut_metadata.

# Build & Deploy

This repo uses the [https://developer.spotify.com/documentation/web-api/tutorials/code-pkce-flow](Spotify API authenticated with PKCE). The `clientId` is hardcoded to my app, this id is public.

I have configured it to only work on:
`https://wiluxgit.github.io/webrtc-hitster/index.html`
`http://127.0.0.1:5500/index.html`

As such it's theoretically possible to test this code locally using LiveServer in vscode. But in order to deploy the code you must change the `clientID` to your own.