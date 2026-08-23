/**
 * コールガイド共通スクリプト (player.js)
 * 楽曲の辞書データをもとにコール表を動的に生成し、YouTube動画の再生と連動させます。
 */

var ytPlayer = null;
var checkTimer = null;

/**
 * 時間表記（"0:07", "1:23", 7 など）を秒数（数値）にパース
 * @param {string|number} time 
 * @returns {number} 秒数
 */
function parseTimeToSeconds(time) {
  if (typeof time === 'number') return time;
  if (!time) return 0;
  var str = String(time).trim();
  if (str.indexOf(':') !== -1) {
    var parts = str.split(':');
    var min = parseFloat(parts[0]) || 0;
    var sec = parseFloat(parts[1]) || 0;
    return min * 60 + sec;
  }
  return parseFloat(str) || 0;
}

/**
 * 秒数から表示用時間文字列（"0:07~" など）を自動生成
 * @param {number} startSec 
 * @returns {string} 表示用時間文字列
 */
function formatSecondsToDisplay(startSec) {
  var min = Math.floor(startSec / 60);
  var sec = Math.floor(startSec % 60);
  return min + ':' + (sec < 10 ? '0' : '') + sec + '~';
}

/**
 * HTMLエスケープ処理
 */
function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * 改行や配列をHTMLフォーマットに変換
 */
function formatContent(content) {
  if (Array.isArray(content)) {
    return content.map(function(line) {
      return escapeHtml(line);
    }).join('<br>');
  }
  if (!content) return '';
  return escapeHtml(String(content)).replace(/\n/g, '<br>');
}

/**
 * コールガイドの初期化
 * @param {Object} config
 * @param {string} config.videoId - YouTubeの動画ID (11桁)
 * @param {Array<Object>} config.calls - コールデータの辞書配列
 * @param {string} [config.containerId='call-list-container'] - コール一覧を挿入する要素ID
 * @param {string} [config.playerId='player'] - YouTubeプレイヤーの要素ID
 */
function initCallGuide(config) {
  if (!config) return;
  var videoId = config.videoId;
  var calls = config.calls || [];
  var containerId = config.containerId || 'call-list-container';
  var playerId = config.playerId || 'player';

  // 1. コールブロックの動的生成
  function renderBlocks() {
    var container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = '';
    calls.forEach(function(item, index) {
      var startSec = parseTimeToSeconds(item.start);
      var endSec = parseTimeToSeconds(item.end);
      var timeLabel = item.time || formatSecondsToDisplay(startSec);

      var block = document.createElement('div');
      block.className = 'call-block';
      block.setAttribute('data-start', startSec);
      block.setAttribute('data-end', endSec);
      block.setAttribute('data-index', index);

      var html = '<span class="time-label">' + escapeHtml(timeLabel) + '</span>';
      if (item.lyrics) {
        html += '<div class="lyrics-text">' + formatContent(item.lyrics) + '</div>';
      }
      if (item.call) {
        html += '<div class="call">' + formatContent(item.call) + '</div>';
      }
      block.innerHTML = html;

      // クリック時に動画をその時間へシーク
      block.addEventListener('click', function() {
        if (ytPlayer && typeof ytPlayer.seekTo === 'function') {
          ytPlayer.seekTo(startSec, true);
          if (typeof ytPlayer.playVideo === 'function') {
            ytPlayer.playVideo();
          }
        }
      });

      container.appendChild(block);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderBlocks);
  } else {
    renderBlocks();
  }

  // 2. YouTube IFrame Player API のセットアップ
  if (videoId) {
    function createPlayer() {
      if (window.YT && window.YT.Player) {
        ytPlayer = new YT.Player(playerId, {
          height: '315',
          width: '560',
          videoId: videoId,
          playerVars: {
            'playsinline': 1,
            'rel': 0,
            'controls': 0 // 標準コントロールを非表示にする場合
          },
          events: {
            'onStateChange': onPlayerStateChange
          }
        });
      }
    }

    if (window.YT && window.YT.Player) {
      createPlayer();
    } else {
      window.onYouTubeIframeAPIReady = createPlayer;

      var existingTag = document.querySelector('script[src*="youtube.com/iframe_api"]');
      if (!existingTag) {
        var tag = document.createElement('script');
        tag.src = "https://www.youtube.com/iframe_api";
        var firstScriptTag = document.getElementsByTagName('script')[0];
        if (firstScriptTag && firstScriptTag.parentNode) {
          firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
        } else {
          document.head.appendChild(tag);
        }
      }
    }
  }
}

/**
 * プレイヤーの状態変化イベントハンドラ
 */
function onPlayerStateChange(event) {
  if (event.data === YT.PlayerState.PLAYING) {
    if (!checkTimer) {
      checkTimer = setInterval(updateHighlight, 250);
    }
  } else {
    if (checkTimer) {
      clearInterval(checkTimer);
      checkTimer = null;
    }
  }
}

/**
 * 現在の再生時間に合わせてコールブロックをハイライト ＆ カスタムプレイヤーの表示を更新
 */
function updateHighlight() {
  if (!ytPlayer || typeof ytPlayer.getCurrentTime !== 'function') return;
  var currentTime = ytPlayer.getCurrentTime();
  var duration = ytPlayer.getDuration();
  var blocks = document.querySelectorAll('.call-block');

  // --- 1. コールブロックのハイライト処理 ---
  blocks.forEach(function(block) {
    var start = parseFloat(block.getAttribute('data-start'));
    var end = parseFloat(block.getAttribute('data-end'));

    if (!isNaN(start) && !isNaN(end) && end > start && currentTime >= start && currentTime < end) {
      block.classList.add('active');
    } else {
      block.classList.remove('active');
    }
  });

  // --- 2. カスタムプレイヤー（タイルUI）の表示更新処理 ---
  var currentTimeEl = document.getElementById('current-time');
  var durationEl = document.getElementById('duration');
  var seekBar = document.getElementById('seek-bar');

  if (currentTimeEl) {
    currentTimeEl.textContent = formatSecondsToDisplay(currentTime).replace('~', '');
  }
  if (durationEl && duration > 0) {
    durationEl.textContent = formatSecondsToDisplay(duration).replace('~', '');
  }
  if (seekBar && duration > 0) {
    seekBar.value = (currentTime / duration) * 100;
  }
}

/**
 * DOM読み込み完了時にカスタムプレイヤーの操作イベントを登録
 */
document.addEventListener('DOMContentLoaded', function() {
  var playPauseBtn = document.getElementById('play-pause-btn');
  var iconPlay = document.getElementById('icon-play');
  var iconPause = document.getElementById('icon-pause');
  var seekBar = document.getElementById('seek-bar');
  var volumeBar = document.getElementById('volume-bar');
  var muteBtn = document.getElementById('mute-btn');
  var iconVolume = document.getElementById('icon-volume');
  var iconMuted = document.getElementById('icon-muted');

  // 再生 / 一時停止
  if (playPauseBtn) {
    playPauseBtn.addEventListener('click', function() {
      if (!ytPlayer || typeof ytPlayer.getPlayerState !== 'function') return;
      var state = ytPlayer.getPlayerState();
      if (state === YT.PlayerState.PLAYING) {
        ytPlayer.pauseVideo();
        if (iconPlay) iconPlay.classList.remove('hidden');
        if (iconPause) iconPause.classList.add('hidden');
      } else {
        ytPlayer.playVideo();
        if (iconPlay) iconPlay.classList.add('hidden');
        if (iconPause) iconPause.classList.remove('hidden');
      }
    });
  }

  // シークバー操作
  if (seekBar) {
    seekBar.addEventListener('input', function() {
      if (!ytPlayer || typeof ytPlayer.getDuration !== 'function') return;
      var duration = ytPlayer.getDuration();
      var seekToTime = duration * (seekBar.value / 100);
      ytPlayer.seekTo(seekToTime, true);
    });
  }

  // 音量変更
  if (volumeBar) {
    volumeBar.addEventListener('input', function(e) {
      if (ytPlayer && typeof ytPlayer.setVolume === 'function') {
        ytPlayer.setVolume(e.target.value);
      }
    });
  }

  // ミュート切替
  if (muteBtn) {
    muteBtn.addEventListener('click', function() {
      if (!ytPlayer || typeof ytPlayer.isMuted !== 'function') return;
      if (ytPlayer.isMuted()) {
        ytPlayer.unMute();
        if (iconVolume) iconVolume.classList.remove('hidden');
        if (iconMuted) iconMuted.classList.add('hidden');
      } else {
        ytPlayer.mute();
        if (iconVolume) iconVolume.classList.add('hidden');
        if (iconMuted) iconMuted.classList.remove('hidden');
      }
    });
  }
});