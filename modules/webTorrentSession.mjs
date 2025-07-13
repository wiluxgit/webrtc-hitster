async function roomToInfoHash(room) {
    const buf = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(room));
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function decodeBencodeString(buf) {
    // Only decode if it's a bencoded string (e.g. "4:test")
    const str = new TextDecoder().decode(buf);
    const match = str.match(/^(\d+):/);
    if (match) {
        const len = parseInt(match[1], 10);
        // Defensive: only return if the string is the right length
        if (str.length >= match[0].length + len) {
            return str.substr(match[0].length, len);
        }
    }
    // Fallback: return error
    return new Error("Not a valid bencoded string");
}

export class WebTorrentSession {
    constructor({
        roomId = null,
        onStatus = (str) => { },
        onChatMessage = (str) => { },
        onSystemMessage = (str) => { },
        client = null
    } = {}) {
        this.roomId = roomId;
        this.onStatus = onStatus;
        this.onChatMessage = onChatMessage;
        this.onSystemMessage = onSystemMessage;
        this.client = client || new WebTorrent();
        this.wire = null;
        this.init();
    }

    async init() {
        const infoHash = await roomToInfoHash(this.roomId);
        const magnetURI = `magnet:?xt=urn:btih:${infoHash}&dn=webtorrent-chat-${this.roomId}`;
        console.log("Connecting to room:", this.roomId, "Magnet URI:", magnetURI);

        // Use a small dummy buffer as the "file" to seed
        const binary = "Hello, this is a WebTorrent chat test!";
        const dummy = new Blob([Uint8Array.from(binary, c => c.charCodeAt(0))]);
        this.client.seed(dummy, { name: this.roomId }, torrent => {
            torrent.on('wire', w => this.setupWire(w));
        });

        // Connect to the room as a peer
        this.client.add(magnetURI, torrent => {
            torrent.on('wire', w => this.setupWire(w));
        });
    }

    sendMessage(msg) {
        if (this.wire) {
            this.wire.extended('ut_metadata', new TextEncoder().encode(msg));
        } else {
            this.onSystemMessage("Cannot send message, not connected to peer.");
        }
    }

    setupWire(w) {
        this.wire = w;
        this.onStatus("Status: Connected!");
        this.onSystemMessage("Peer connected");
        this.wire.on('extended', (ext, buf) => {
            if (ext === 'ut_metadata' && buf) {
                try {
                    const msg = decodeBencodeString(buf);
                    this.onChatMessage(msg);
                } catch { }
            }
        });
    }
}


