class TilePlayer extends HTMLElement {
  connectedCallback() {
    // 1. YouTubeの動画IDなどを属性から取得（ページごとに動画を変えたい場合用）
    //const videoId = this.getAttribute('video-id') || '';

    // 2. HTMLをJS内に直接記述する
    this.innerHTML = `
    <div class="tile-player">

    <!-- 現在時間表示 -->
    <div class="tile-item tile-time">
        <span id="current-time">0:00</span>
    </div>

    <!-- シークバー（横いっぱいに広がる） -->
    <div class="tile-item tile-seek">
        <input type="range" id="seek-bar" value="0" min="0" max="100" step="0.1">
    </div>

        <!-- 再生/停止 -->
    <button id="play-pause-btn" class="tile-item tile-btn" aria-label="再生/一時停止">
        <svg id="icon-play" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
        <svg id="icon-pause" viewBox="0 0 24 24" class="hidden"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
    </button>
    `;

    // 3. プレイヤーと連動させる初期化JSをここで実行する
    // if (typeof initPlayer === 'function') { initPlayer(); }
  }
}

customElements.define('tile-player', TilePlayer);