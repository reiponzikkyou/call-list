class SongNavigation extends HTMLElement {
  connectedCallback() {
    this.innerHTML = '<a href="../index.html" class="back-btn">← 楽曲一覧に戻る</a>';
  }
}

class CallGuideNotice extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <div class="notice">
        ※再生に合わせてコールのタイミングが自動でハイライトされます。<br>
        ※コールブロックをクリックするとそのタイミングへスキップして再生できます。<br>
        ※歌詞の全文や正確なフレーズは各種公式音源・歌詞検索サイトをご確認ください。
      </div>
    `;
  }
}

customElements.define('song-navigation', SongNavigation);
customElements.define('call-guide-notice', CallGuideNotice);
