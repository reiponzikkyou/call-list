(() => {
  // グローバル汚染を防ぐため、このファイル内の変数はすべてこの中に隔離
  let customPlayer;

  // プレイヤーの初期化処理
  function initCustomPlayer() {
    // 既存のiframe、または新規生成領域を指定
    customPlayer = new YT.Player('youtube-player', {
      events: {
        'onReady': onCustomPlayerReady
      }
    });
  }

  // 既にYouTube APIが読み込まれているか判定して初期化
  if (window.YT && window.YT.Player) {
    initCustomPlayer();
  } else {
    // まだ読み込まれていない場合はAPI読み込みイベントをフック
    const prevReady = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = function() {
      if (prevReady) prevReady();
      initCustomPlayer();
    };
  }

  function formatTime(seconds) {
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    return `${min}:${sec < 10 ? '0' : ''}${sec}`;
  }

  function onCustomPlayerReady() {
    const playPauseBtn = document.getElementById('play-pause-btn');
    const iconPlay = document.getElementById('icon-play');
    const iconPause = document.getElementById('icon-pause');
    const seekBar = document.getElementById('seek-bar');
    const volumeBar = document.getElementById('volume-bar');
    const muteBtn = document.getElementById('mute-btn');
    const iconVolume = document.getElementById('icon-volume');
    const iconMuted = document.getElementById('icon-muted');
    const currentTimeEl = document.getElementById('current-time');
    const durationEl = document.getElementById('duration');

    if (durationEl && customPlayer.getDuration) {
      durationEl.textContent = formatTime(customPlayer.getDuration());
    }

    // 再生/停止
    if (playPauseBtn) {
      playPauseBtn.addEventListener('click', () => {
        const state = customPlayer.getPlayerState();
        if (state === YT.PlayerState.PLAYING) {
          customPlayer.pauseVideo();
          iconPlay?.classList.remove('hidden');
          iconPause?.classList.add('hidden');
        } else {
          customPlayer.playVideo();
          iconPlay?.classList.add('hidden');
          iconPause?.classList.remove('hidden');
        }
      });
    }

    // シークバー
    if (seekBar) {
      seekBar.addEventListener('input', () => {
        const seekToTime = customPlayer.getDuration() * (seekBar.value / 100);
        customPlayer.seekTo(seekToTime, true);
      });
    }

    // 音量
    if (volumeBar) {
      volumeBar.addEventListener('input', (e) => {
        customPlayer.setVolume(e.target.value);
      });
    }

    // ミュート
    if (muteBtn) {
      muteBtn.addEventListener('click', () => {
        if (customPlayer.isMuted()) {
          customPlayer.unMute();
          iconVolume?.classList.remove('hidden');
          iconMuted?.classList.add('hidden');
        } else {
          customPlayer.mute();
          iconVolume?.classList.add('hidden');
          iconMuted?.classList.remove('hidden');
        }
      });
    }

    // 進行状況の監視・更新
    setInterval(() => {
      if (customPlayer && customPlayer.getCurrentTime && customPlayer.getPlayerState() === YT.PlayerState.PLAYING) {
        const current = customPlayer.getCurrentTime();
        const duration = customPlayer.getDuration();
        if (currentTimeEl) currentTimeEl.textContent = formatTime(current);
        if (seekBar && duration > 0) {
          seekBar.value = (current / duration) * 100;
        }
      }
    }, 500);
  }
})();