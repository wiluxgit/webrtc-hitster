import { SpotifyAuth } from "./spotifyAuth.mjs";
import { WebTorrentSession } from "./webTorrentSession.mjs";
import { spotifyRequest } from "./spotifyRequest.mjs";
import { randomUsername } from "./randomUsername.mjs";
import "./protocol.mjs";
import { ProtocolWrapper } from "./protocol.mjs";

export function gameApp() {
  return {
    // prejoin
    joinLink: "",
    // ui
    showLeftSidebar: false,
    showRightSidebar: false,
    popupOn: false,
    popupText: "undefined",
    // Room state
    roomJoined: false,
    roomId: '',
    username: randomUsername(),
    roomMembers: [
      { id: 0, name: "You" }
    ],
    roomStatus: "?",
    roomChatOutput: [],
    roomChatInput: "",
    /** @type {ProtocolWrapper|null} */
    prot: null,
    // host settings
    host: {
      isHost: false,
      spotifyAuth: null,
      spotifyAuthStatusText: "Not logged in",
      spotifyAuthToken: null,
    },

    init() {
      if (this._initialized) return;
      this._initialized = true;

      // Auto enter room if in url
      const urlParams = new URLSearchParams(window.location.search);
      const room = urlParams.get('room');
      if (room) {
        this.tryEnterRoom(room)
      }

      // Playing on PC, there is room to always display the sidebars
      if (window.innerWidth >= 1000) {
        this.showLeftSidebar = true;
        this.showRightSidebar = true;
      }

      // Make arrow keys toggle sidebars
      window.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') {
          this.toggleLeftSidebar();
        } else if (e.key === 'ArrowRight') {
          this.toggleRightSidebar();
        }
      });

      // Needs to be done here to handle callbacks from spotify auth
      const hostp = this.host;
      hostp.spotifyAuth = new SpotifyAuth({
        onStatus: msg => {
          hostp.spotifyAuthStatusText = msg;
        },
        onAuthSuccess: (msg, data, callbackStateParam) => {
          hostp.spotifyAuthStatusText = msg
          hostp.spotifyAuthToken = data.access_token;
          console.log("onAuthSuccess", msg, data, callbackStateParam);
          // doing spotify auth reloads the page, restore how it was before
          if (callbackStateParam && callbackStateParam.room) {
            this.tryEnterRoom(callbackStateParam.room)
          }
        },
        onAuthFail: (msg, data, callbackStateParam) => {
          hostp.spotifyAuthStatusText = msg;
          console.log("onAuthFail", msg, data, callbackStateParam);
          // doing spotify auth reloads the page, restore how it was before
          if (callbackStateParam && callbackStateParam.room) {
            this.tryEnterRoom(callbackStateParam.room)
          }
        },
        onNoCode: msg => {
          hostp.spotifyAuthStatusText = msg;
        }
      });
    },
    // Connect and setup WebTorrent
    tryEnterRoom(roomId) {
      if (typeof roomId !== 'string' || roomId.length !== 4) {
        this.displayPopup(`❌ Invalid roomId: \"${roomId}\"`)
        return;
      }

      const url = new URL(window.location.href);
      url.searchParams.set("room", roomId);
      // Who knows why doing it immedately does not work
      setTimeout(() => { history.replaceState({}, "", url); }, 0);

      this.roomId = roomId;
      this.roomJoined = true;
      this.roomStatus = "Waiting for people to join..."

      /** @type {WebTorrentSession} */
      const webTorrentSession = new WebTorrentSession({
        roomId: roomId,
        onStatus: msg => this.roomStatus = msg,
        onDataMessage: msg => this.prot.recieveRaw(msg),
        onSystemMessage: msg => this.appendChat("[System]", msg),
      });
      /** @type {Sender} */
      const sender = {uuid: this.username}
      this.prot = new ProtocolWrapper(
        tx => webTorrentSession.sendRaw(tx),
        {uuid: this.username},
        {
          onParseError: (err) => {
            console.trace("parse error", err)
          },
          onPingRequest: (sender, msg) => this.prot.sendPingReply({
            "hostPlayer": msg.hostPlayer,
            "player": {"playerName": this.username},
          }),
          onChatText: (sender, msg) => this.appendChat(
            sender.uuid, msg.message
          )
        }
      )
      // TODO think harder about when this should be done
      this.host.isHost = true;
    },
    // spotify
    loginWithSpotify() {
      this.host.spotifyAuth.authenticateAndReload({ room: this.roomId })
    },
    // pre room setup
    createRoom() {
      const roomId = Math.random().toString(36).slice(2, 6).toUpperCase();
      this.tryEnterRoom(roomId);
    },
    joinRoom() {
      // if url use that, if just room code use that
      const input = this.joinLink.trim();
      let roomId = null;
      try {
        const url = new URL(input);
        roomId = url.searchParams.get("room");
      } catch (e) {
        if (input.length === 4) {
          roomId = input;
        }
      }
      this.tryEnterRoom(roomId)
    },
    // general popup util
    displayPopup(msg) {
      this.popupText = msg;
      this.popupOn = true;
      setTimeout(() => {
        this.popupOn = false;
      }, 2000);
    },
    // share button
    shareRoomUrl() {
      const url = new URL(window.location.href);
      url.searchParams.set("room", this.roomId);
      const urlString = url.toString();
      navigator.clipboard.writeText(urlString);
      this.displayPopup("✅ Room URL copied to clipboard!")
    },
    toggleLeftSidebar() {
      this.showLeftSidebar = !this.showLeftSidebar;
    },
    toggleRightSidebar() {
      this.showRightSidebar = !this.showRightSidebar;
    },
    // Room chat
    chatSubmit() {
      this.appendChat("You", this.roomChatInput);
      this.prot.sendChatText({"message": this.roomChatInput});
      this.roomChatInput = "";
    },
    appendChat(sender, text) {
      const newId = this.roomChatOutput.length
        ? this.roomChatOutput[this.roomChatOutput.length - 1].id + 1
        : 0;

      this.roomChatOutput.push({
        id: newId,
        sender: sender,
        text: text
      });
    },
    // game state
    currentTrack: 'Chill Vibes - DJ Flow',
    yeargroups: [
      {
        id: 0, year: "2010", tracks: [
          { id: 1, name: "Song A", artist: "Artist 1", preview_url: "x.mp3" },
          { id: 2, name: "Song B", artist: "Artist 2", preview_url: "y.mp3" },
        ]
      },
      {
        id: 1, year: "2022", tracks: [
          { id: 1, name: "Song A", artist: "Artist 1", preview_url: "x.mp3" },
          { id: 2, name: "Song B", artist: "Artist 2", preview_url: "y.mp3" },
        ]
      },
      {
        id: 2, year: "2023", tracks: [
          { id: 1, name: "Song C", artist: "Artist 3", preview_url: "z.mp3" },
        ]
      },
      {
        id: 3, year: "", new: true, tracks: [
        ]
      },
    ],
  };
}