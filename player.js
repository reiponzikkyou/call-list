/**
 * コールガイド共通スクリプト (player.js)
 */

var ytPlayer = null;
var checkTimer = null;

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

function formatSecondsToDisplay(startSec) {
  var min = Math.floor(startSec / 60);
  var sec = Math.floor(startSec % 60);
  return min + ':' + (sec < 10 ? '0' : '') + sec + '~';
}

function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatContent(content) {
  if (Array.isArray(content)) {
    return content.map(function(line) {
      return escapeHtml(line);
    }).join('<br>');
  }
  if (!content) return '';
  return escapeHtml(String(content)).replace(/\n/g, '<br>');
}

function initCallGuide(config) {
  if (!config) return;
  var videoId = config.videoId;
  var calls = config.calls || [];
  var containerId = config.containerId || 'call-list-container';
  var playerId = config.playerId || 'player';

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
            'controls': 0
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
 * コールハイライト・現在時間表示・シークバーの更新
 */
function updateHighlight() {
  if (!ytPlayer || typeof ytPlayer.getCurrentTime !== 'function') return;
  var currentTime = ytPlayer.getCurrentTime();
  var duration = ytPlayer.getDuration();
  var blocks = document.querySelectorAll('.call-block');

  // 1. コールブロックのハイライト
  blocks.forEach(function(block) {
    var start = parseFloat(block.getAttribute('data-start'));
    var end = parseFloat(block.getAttribute('data-end'));

    if (!isNaN(start) && !isNaN(end) && end > start && currentTime >= start && currentTime < end) {
      block.classList.add('active');
    } else {
      block.classList.remove('active');
    }
  });

  // 2. 現在時間テキストの更新
  var currentTimeEl = document.getElementById('current-time');
  if (currentTimeEl) {
    currentTimeEl.textContent = formatSecondsToDisplay(currentTime).replace('~', '');
  }

  // 3. シークバーの更新
  var seekBar = document.getElementById('seek-bar');
  if (seekBar && duration > 0) {
    seekBar.value = (currentTime / duration) * 100;
  }
}

/**
 * カスタムプレイヤー操作イベント
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

  // 音量操作
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