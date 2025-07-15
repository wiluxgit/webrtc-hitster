// @ts-check
// @module

/**
 * @typedef {Object} Player
 * @property {string} playerName
 */

/**
 * @typedef {Object} PingRequest
 * @property {Player} hostPlayer
 */

/**
 * @typedef {Object} PingReply
 * @property {Player} hostPlayer
 * @property {Player} player
 */

/**
 * @typedef {Object} ChatText
 * @property {string} message
 */

/**
 * @typedef {Object} ProtocolMessage
 * @property {"PingRequest"|"PingReply"|"ChatText"} type
 * @property { PingRequest | PingReply | ChatText } payload
 */

/**
 * @typedef {Object} ProtocolWrapperArgs
  * @param {(buf: Uint8Array) => Promise<void>} tx
 * @property {(msg: PingRequest) => void} onPingRequest
 * @property {(msg: PingReply) => void} onPingReply
 * @property {(msg: ChatText) => void} onChatText
 */

export class ProtocolWrapper {
  /**
   * @param {ProtocolWrapperArgs} args
   */
  constructor({
    tx,
    onPingRequest = () => { },
    onPingReply = () => { },
    onChatText = () => { },
  } = {}) {
    this.tx = tx;
    this.onPingRequest = onPingRequest;
    this.onPingReply = onPingReply
    this.onChatText = onChatText;
  }

  /**
   * Handle a raw incoming buffer (assumed to be JSON).
   * @param {Uint8Array} buf
   */
  handleIncoming(buf) {
    try {
      const jsonStr = new TextDecoder().decode(buf);
      /** @type {ProtocolMessage} */
      const msg = JSON.parse(jsonStr);

      switch (msg.type) {
        case "PingRequest":
          this.onPingRequest(msg.payload);
          break;
        case "PingReply":
          this.onPingReply(msg.payload);
          break;
        case "ChatText":
          this.onChatText(msg.payload);
          break;
        default:
          console.warn("Unknown protocol message type:", msg.type);
      }
    } catch (err) {
      console.error("Failed to parse incoming message:", err);
    }
  }

  /**
   * Serialize a protocol message to Uint8Array for sending.
   * @param {ProtocolMessage} json
   */
  sendRaw(json) {
    this.tx(new TextEncoder().encode(JSON.stringify(json)))
  }

  /** @param {PingRequest} msg */
  sendPingRequest = (msg) => this.sendRaw({ type: "PingRequest", payload: msg })
  /** @param {PingReply} msg */
  sendPingReply = (msg) => this.sendRaw({ type: "PingReply", payload: msg })
  /** @param {ChatText} msg */
  sendChatText = (msg) => this.sendRaw({ type: "ChatText", payload: msg })
}
