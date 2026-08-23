// YouTube API 読み込み
const tag = document.createElement('script');
tag.src = "https://www.youtube.com/iframe_api";
const firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

let player;

function onYouTubeIframeAPIReady() {
  player = new YT.Player('youtube-player', {
    height: '360',
    width: '640',
    videoId: 'M7lc1UVf-VE',
    playerVars: {
      'controls': 0,
      'rel': 0
    },
    events: {
      'onReady': onPlayerReady
    }
  });
}

function formatTime(seconds) {
  const min = Math.floor(seconds / 60);
  const sec = Math.floor(seconds % 60);
  return `${min}:${sec < 10 ? '0' : ''}${sec}`;
}

function onPlayerReady() {
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

  durationEl.textContent = formatTime(player.getDuration());

  // 再生/一時停止 アイコン切り替え
  playPauseBtn.addEventListener('click', () => {
    const state = player.getPlayerState();
    if (state === YT.PlayerState.PLAYING) {
      player.pauseVideo();
      iconPlay.classList.remove('hidden');
      iconPause.classList.add('hidden');
    } else {
      player.playVideo();
      iconPlay.classList.add('hidden');
      iconPause.classList.remove('hidden');
    }
  });

  // シークバー制御
  seekBar.addEventListener('input', () => {
    const seekToTime = player.getDuration() * (seekBar.value / 100);
    player.seekTo(seekToTime, true);
  });

  // 音量変更
  volumeBar.addEventListener('input', (e) => {
    player.setVolume(e.target.value);
  });

  // ミュート切り替え アイコン制御
  muteBtn.addEventListener('click', () => {
    if (player.isMuted()) {
      player.unMute();
      iconVolume.classList.remove('hidden');
      iconMuted.classList.add('hidden');
    } else {
      player.mute();
      iconVolume.classList.add('hidden');
      iconMuted.classList.remove('hidden');
    }
  });

  // リアルタイム更新
  setInterval(() => {
    if (player && player.getCurrentTime && player.getPlayerState() === YT.PlayerState.PLAYING) {
      const current = player.getCurrentTime();
      const duration = player.getDuration();
      currentTimeEl.textContent = formatTime(current);
      if (duration > 0) {
        seekBar.value = (current / duration) * 100;
      }
    }
  }, 500);
}