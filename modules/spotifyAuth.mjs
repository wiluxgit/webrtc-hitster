import { urlUtil } from './urlUtil.mjs';
import { env } from '../env.mjs';

const clientId = env.clientId;               // Ensure this matches your Spotify app settings
const redirectUri = urlUtil.getCurrentUrl(); // Ensure this matches your Spotify app settings
const scopes = 'playlist-read-private playlist-read-collaborative user-read-private';

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

function setLocalStorageToken(token) {
    localStorage.setItem('spotify_access_token', token);
}
function getLocalStorageToken() {
    return localStorage.getItem('spotify_access_token');
}
function removeLocalStorageToken() {
    localStorage.removeItem('spotify_access_token');
}
async function isTokenValid(token) {
    try {
        const res = await fetch('https://api.spotify.com/v1/me', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        return res.ok; // true if status is 200–299
    } catch (err) {
        return false;
    }
}

export class SpotifyAuth {
    constructor({
        onStatus = (msg) => {},
        onAuthSuccess = (msg, data, callbackStateParam) => {},
        onAuthFail = (msg, data, callbackStateParam) => {},
        onNoCode = (msg) => {},
    } = {}) {
        this.onStatus = onStatus;
        this.onAuthSuccess = onAuthSuccess;
        this.onAuthFail = onAuthFail;
        this.onNoCode = onNoCode;
        this.init();
    }

    async init() {
        let callbackStateParam = null
        const params = new URLSearchParams(window.location.search);
        const state = params.get('state');
        if (state) {
            try {
                callbackStateParam = JSON.parse(decodeURIComponent(state));
                this.onStatus("Recovered oAuth2 state params");
            } catch(e) {
                this.onStatus("Could not recover oAuth2 state params");
            }
        }

        const code = params.get('code');
        const storedToken = getLocalStorageToken();
        if (code) {
            // Remove the code & state params as they do not matter any more
            params.delete('code');
            params.delete('state');
            const newUrl = window.location.pathname + (params.toString() ? '?' + params.toString() : '') + window.location.hash;
            history.replaceState({}, document.title, newUrl);

            this.onStatus("Exchanging code for token...");
            const codeVerifier = localStorage.getItem('spotify_code_verifier');
            if (!codeVerifier) {
                this.onAuthFail("Missing code verifier. Please try logging in again.", codeVerifier);
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
                setLocalStorageToken(data.access_token);
                this.onAuthSuccess("Spotify Authenticated!", data, callbackStateParam);
            } else {
                this.onAuthFail("Spotify Auth failed.", data, callbackStateParam);
            }
            window.history.replaceState({}, document.title, window.location.pathname);
        } else if (storedToken) {
            // If this is not a auth callback try with the stored token

            // test if the stored token still works
            if (await isTokenValid(storedToken)) {
                this.onAuthSuccess(
                    "Spotify Authenticated! (cached)",
                    { access_token: storedToken },
                    null
                );
                return;
            } else {
                removeLocalStorageToken();
                this.onAuthFail("Stored token invalid or expired. Re-authentication needed.", null, callbackStateParam);
            }
        }
    }

    async authenticateAndReload(callbackStateParam) {
        const stateString = encodeURIComponent(JSON.stringify(callbackStateParam));
        const codeVerifier = generateRandomString(64);
        const codeChallenge = await generateCodeChallenge(codeVerifier);
        localStorage.setItem('spotify_code_verifier', codeVerifier);

        const params = new URLSearchParams({
            response_type: 'code',
            client_id: clientId,
            scope: scopes,
            redirect_uri: redirectUri,
            code_challenge_method: 'S256',
            code_challenge: codeChallenge,
            state: stateString,
        });
        this.onStatus('Redirecting to Spotify for authentication...');
        window.location = 'https://accounts.spotify.com/authorize?' + params.toString();
    }
}