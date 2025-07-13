# Build & Deploy

This repo uses the [https://developer.spotify.com/documentation/web-api/tutorials/code-pkce-flow](Spotify API authenticated with PKCE). The `clientId` is hardcoded to my app, this id is public.

I have configured it to only work on:
`https://wiluxgit.github.io/webrtc-hitster/index.html`
`http://127.0.0.1:5500/index.html`

As such it's theoretically possible to test this code locally using LiveServer in vscode. But in order to deploy the code you must change the `clientID` to your own.