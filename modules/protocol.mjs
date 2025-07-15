// @ts-check
// @module

/**
 * @typedef {Object} Sender
 * @typedef {string} uuid // todo
 */

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
 * @typedef {(
 *   { sender: Sender, type: "PingRequest", payload: PingRequest } |
 *   { sender: Sender, type: "PingReply", payload: PingReply } |
 *   { sender: Sender, type: "ChatText", payload: ChatText }
 * )} ProtocolMessage
 */

/**
 * @typedef {Object} ProtocolWrapperCallbacks
 * @property {(err: any) => void} [onParseError]
 * @property {(sender: Sender, msg: PingRequest) => void} [onPingRequest]
 * @property {(sender: Sender, msg: PingReply) => void} [onPingReply]
 * @property {(sender: Sender, msg: ChatText) => void} [onChatText]
 */
export class ProtocolWrapper {
  /**
   * @param {(content: string) => Promise<void>} tx
   * @param {Sender} sender
   * @param {ProtocolWrapperCallbacks} [options]
   */
  constructor(tx, sender, {
    onParseError = (msg) => { console.log("parse error", msg) },
    onPingRequest = () => { },
    onPingReply = () => { },
    onChatText = () => { },
  } = {}) {
    this.tx = tx;
    this.sender = sender;
    this.onParseError = onParseError;
    this.onPingRequest = onPingRequest;
    this.onPingReply = onPingReply;
    this.onChatText = onChatText;
  }

  /**
   * Deserialize a protocol message and act on it
   * @param {string} content
   */
  recieveRaw(content) {
    try {
      /** @type {ProtocolMessage} */
      const msg = JSON.parse(content);

      switch (msg.type) {
        case "PingRequest":
          this.onPingRequest(msg.sender, msg.payload);
          break;
        case "PingReply":
          this.onPingReply(msg.sender, msg.payload);
          break;
        case "ChatText":
          this.onChatText(msg.sender, msg.payload);
          break;
        default:
          // @ts-expect-error
          this.onParseError({"Unknown protocol message type": msg.type});
      }
    } catch (err) {
      this.onParseError({"Failed to parse incoming message": err, "content": content});
    }
  }

  /**
   * Serialize a protocol message to string for sending.
   * @param {ProtocolMessage} json
   */
  sendRaw(json) {
    this.tx(JSON.stringify(json))
  }

  /** @param {PingRequest} msg */
  sendPingRequest = (msg) => this.sendRaw({ type: "PingRequest", sender: this.sender, payload: msg })
  /** @param {PingReply} msg */
  sendPingReply = (msg) => this.sendRaw({ type: "PingReply", sender: this.sender, payload: msg })
  /** @param {ChatText} msg */
  sendChatText = (msg) => this.sendRaw({ type: "ChatText", sender: this.sender, payload: msg })
}