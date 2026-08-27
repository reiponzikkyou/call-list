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

const PUBLIC_SITE_URL = 'https://reiponzikkyou.github.io/call-list/';

function getPublicSongUrl() {
  const encodedFileName = window.location.pathname.split('/').pop();
  let fileName = encodedFileName || 'index.html';
  try {
    fileName = decodeURIComponent(fileName);
  } catch (error) {
    // 不正なエンコードの場合は取得したファイル名をそのまま使用する
  }
  return new URL('songs/' + encodeURIComponent(fileName), PUBLIC_SITE_URL).href;
}

function installSongShareButton() {
  const title = document.querySelector('.song-title');
  if (!title || title.parentElement?.classList.contains('song-title-row')) return;

  const row = document.createElement('div');
  row.className = 'song-title-row';
  title.parentNode.insertBefore(row, title);
  row.appendChild(title);

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'song-share-btn';
  button.setAttribute('aria-label', 'この楽曲ページのURLをコピー');
  button.innerHTML = `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M18 16a3 3 0 0 0-2.4 1.2L8.9 13.3a3.2 3.2 0 0 0 0-2.6l6.7-3.9A3 3 0 1 0 15 5c0 .2 0 .4.1.6L8.4 9.5a3 3 0 1 0 0 5l6.7 3.9A3 3 0 1 0 18 16Z"/>
    </svg>
    <span>URLをコピー</span>
  `;

  button.addEventListener('click', async () => {
    const publicUrl = getPublicSongUrl();
    try {
      await navigator.clipboard.writeText(publicUrl);
      const label = button.querySelector('span');
      label.textContent = 'コピーしました';
      window.setTimeout(() => { label.textContent = 'URLをコピー'; }, 1600);
    } catch (error) {
      window.prompt('ページURLをコピーしてください', publicUrl);
    }
  });

  row.appendChild(button);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', installSongShareButton);
} else {
  installSongShareButton();
}
