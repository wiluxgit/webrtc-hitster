import { urlUtil } from './urlUtil.mjs';

const clientId = 'aba3355980884629b31c4f261ff94d7f'; // Ensure this matches your Spotify app settings
const redirectUri = urlUtil.getCurrentUrl();         // Ensure this matches your Spotify app settings
const scopes = 'user-read-private user-read-email';

function base64urlencode(str) {
    return btoa(String.fromCharCode.apply(null, new Uint8Array(str)))
        .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
async function generateCodeChallenge(codeVerifier) {
    const encoder = new TextEncoder();
    const data = encoder.encode(codeVerifier);
    const digest = await window.crypto.subtle.digest('SHA-256', data);
    return base64urlencode(digest);
}
function generateRandomString(length) {
    const array = new Uint8Array(length);
    window.crypto.getRandomValues(array);
    return Array.from(array, dec => ('0' + dec.toString(16)).substr(-2)).join('');
}

export class SpotifyAuth {
    constructor(handlers = {}) {
        // handlers: { onStatus, onAuthSuccess, onAuthFail, onMissingVerifier, onNoCode }
        this.onStatus = handlers.onStatus || (() => {});
        this.onAuthSuccess = handlers.onAuthSuccess || (() => {});
        this.onAuthFail = handlers.onAuthFail || (() => {});
        this.onMissingVerifier = handlers.onMissingVerifier || (() => {});
        this.onNoCode = handlers.onNoCode || (() => {});
    }

    async onPageLoad() {
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');
        if (code) {
            this.onStatus("Exchanging code for token...");
            const codeVerifier = localStorage.getItem('spotify_code_verifier');
            if (!codeVerifier) {
                this.onMissingVerifier("Missing code verifier. Please try logging in again.");
                return;
            }
            const body = new URLSearchParams({
                grant_type: 'authorization_code',
                code: code,
                redirect_uri: redirectUri,
                client_id: clientId,
                code_verifier: codeVerifier
            });

            const response = await fetch('https://accounts.spotify.com/api/token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: body
            });

            const data = await response.json();
            if (data.access_token) {
                this.onAuthSuccess("Spotify Authenticated!", data);
                // Optionally, store the token or use it for API calls
                // localStorage.setItem('spotify_access_token', data.access_token);
            } else {
                this.onAuthFail("Spotify Auth failed.", data);
            }
            window.history.replaceState({}, document.title, window.location.pathname);
        } else {
            this.onNoCode("No code found in URL.");
        }
    }

    async authenticateAndReload() {
        const codeVerifier = generateRandomString(64);
        const codeChallenge = await generateCodeChallenge(codeVerifier);
        localStorage.setItem('spotify_code_verifier', codeVerifier);

        const params = new URLSearchParams({
            response_type: 'code',
            client_id: clientId,
            scope: scopes,
            redirect_uri: redirectUri,
            code_challenge_method: 'S256',
            code_challenge: codeChallenge
        });
        this.onStatus('Redirecting to Spotify for authentication...');
        window.location = 'https://accounts.spotify.com/authorize?' + params.toString();
    }
}
export const spotifyAuth = {
    async handleSpotifyRedirect(spotifyStatusDiv) {
        // Check if we have a code in the URL, if yes
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');
        if (code) {
            spotifyStatusDiv.textContent = "Exchanging code for token...";
            const codeVerifier = localStorage.getItem('spotify_code_verifier');
            if (!codeVerifier) {
                spotifyStatusDiv.textContent = "Missing code verifier. Please try logging in again.";
                return;
            }
            // Exchange code for access token
            const body = new URLSearchParams({
                grant_type: 'authorization_code',
                code: code,
                redirect_uri: redirectUri,
                client_id: clientId,
                code_verifier: codeVerifier
            });

            const response = await fetch('https://accounts.spotify.com/api/token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: body
            });

            const data = await response.json();
            if (data.access_token) {
                spotifyStatusDiv.textContent = "Spotify Authenticated!";
                // Optionally, store the token or use it for API calls
                // localStorage.setItem('spotify_access_token', data.access_token);
            } else {
                spotifyStatusDiv.textContent = "Spotify Auth failed.";
            }
            // Clean up URL
            window.history.replaceState({}, document.title, window.location.pathname);
        } else {
            spotifyStatusDiv.textContent = "No code found in URL.";
        }
    },
    async executeAuth() {
      const codeVerifier = generateRandomString(64);
      const codeChallenge = await generateCodeChallenge(codeVerifier);
      localStorage.setItem('spotify_code_verifier', codeVerifier);

      const params = new URLSearchParams({
        response_type: 'code',
        client_id: clientId,
        scope: scopes,
        redirect_uri: redirectUri,
        code_challenge_method: 'S256',
        code_challenge: codeChallenge
      });
      console.log('Redirecting to Spotify with params:', params.toString());
      alert('Redirecting to Spotify for authentication...');

      window.location = 'https://accounts.spotify.com/authorize?' + params.toString();
    }
}