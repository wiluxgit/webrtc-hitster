export class PlaylistPicker extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._playlists = [];
    this._onPick = null;
    this.render();
  }

  set playlists(list) {
    this._playlists = list || [];
    this.render();
  }

  get playlists() {
    return this._playlists;
  }

  set onPick(fn) {
    this._onPick = fn;
  }

  render() {
    const shadow = this.shadowRoot;
    shadow.innerHTML = `
      <style>
        :host {
          display: block;
          margin: 1em 0;
        }
        select {
          font-size: 1em;
          padding: 0.3em;
        }
      </style>
      <h3>Pick a Playlist</h3>
      <select id="playlistSelect"></select>
    `;

    const select = shadow.getElementById('playlistSelect');
    select.innerHTML = '';
    this._playlists.forEach(pl => {
      const opt = document.createElement('option');
      opt.value = pl.id;
      opt.textContent = pl.name;
      select.appendChild(opt);
    });

    select.onchange = () => {
      const picked = this._playlists.find(pl => pl.id === select.value);
      if (this._onPick) this._onPick(picked);
    };

    // Optionally, trigger onPick for the initial selection
    if (this._playlists.length && this._onPick) {
      this._onPick(this._playlists[0]);
    }
  }
}

customElements.define('playlist-picker', PlaylistPicker);