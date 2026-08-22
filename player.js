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
    // APIがすでに読み込み済みの場合の初期化関数
    function createPlayer() {
      if (window.YT && window.YT.Player) {
        ytPlayer = new YT.Player(playerId, {
          height: '315',
          width: '560',
          videoId: videoId,
          playerVars: {
            'playsinline': 1,
            'rel': 0
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

      // scriptタグがまだ存在しない場合のみ追加
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
 * 現在の再生時間に合わせてコールブロックをハイライト
 */
function updateHighlight() {
  if (!ytPlayer || typeof ytPlayer.getCurrentTime !== 'function') return;
  var currentTime = ytPlayer.getCurrentTime();
  var blocks = document.querySelectorAll('.call-block');

  blocks.forEach(function(block) {
    var start = parseFloat(block.getAttribute('data-start'));
    var end = parseFloat(block.getAttribute('data-end'));

    // start <= currentTime < end のときにハイライト
    if (!isNaN(start) && !isNaN(end) && end > start && currentTime >= start && currentTime < end) {
      block.classList.add('active');
    } else {
      block.classList.remove('active');
    }
  });
}

