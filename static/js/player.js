// Teaser autoplay fallback for mobile browsers (iOS Low Power Mode, WeChat/X5,
// data-saver): if muted autoplay is blocked, start on the first touch or click.
(function () {
  var teaser = document.getElementById('teaser');
  if (!teaser) return;
  teaser.muted = true;
  teaser.defaultMuted = true;
  function tryPlay() {
    var p = teaser.play();
    if (p && typeof p.catch === 'function') p.catch(function () {});
  }
  function armGesture() {
    var once = function () {
      tryPlay();
      ['touchend', 'click', 'scroll'].forEach(function (ev) { document.removeEventListener(ev, once); });
    };
    ['touchend', 'click', 'scroll'].forEach(function (ev) { document.addEventListener(ev, once, { passive: true }); });
  }
  var p = teaser.play();
  if (p && typeof p.then === 'function') {
    p.catch(armGesture);
  }
  // Some browsers resolve play() but never advance; re-check after the data arrives.
  teaser.addEventListener('loadeddata', function () {
    setTimeout(function () { if (teaser.paused) { tryPlay(); armGesture(); } }, 800);
  });
  document.addEventListener('visibilitychange', function () {
    if (!document.hidden && teaser.paused) tryPlay();
  });
})();

// In-video control bar for every clip in the deployment grid:
// play/pause, seek, time, playback speed, and full screen.
// Native controls remain as a fallback if this script does not run.
(function () {
  var SPEEDS = [0.5, 1, 1.5, 2, 4];

  var ICONS = {
    play: '<svg viewBox="0 0 24 24"><path d="M6 4l14 8-14 8z"/></svg>',
    pause: '<svg viewBox="0 0 24 24"><path d="M6 4h4v16H6zM14 4h4v16h-4z"/></svg>',
    full: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5"/></svg>',
    exit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 4v5H4M20 9h-5V4M15 20v-5h5M4 15h5v5"/></svg>'
  };

  function fmt(t) {
    if (!isFinite(t)) return '–:––';
    t = Math.floor(t);
    var m = Math.floor(t / 60), s = t % 60;
    return m + ':' + (s < 10 ? '0' : '') + s;
  }

  function fsElement() {
    return document.fullscreenElement || document.webkitFullscreenElement || null;
  }

  document.querySelectorAll('.video-card video').forEach(function (video) {
    video.removeAttribute('controls');
    video.setAttribute('playsinline', '');

    var player = document.createElement('div');
    player.className = 'player is-paused';
    video.parentNode.insertBefore(player, video);
    player.appendChild(video);

    var label = (video.getAttribute('aria-label') || video.closest('.video-card').querySelector('.video-label')?.textContent || 'video').trim();

    player.insertAdjacentHTML('beforeend',
      '<div class="player-bar">' +
        '<button type="button" class="pb-btn pb-play" aria-label="Play">' + ICONS.play + '</button>' +
        '<input type="range" class="pb-seek" min="0" max="1000" step="1" value="0" aria-label="Seek">' +
        '<span class="pb-time"><span class="pb-cur">0:00</span> / <span class="pb-dur">–:––</span></span>' +
        '<div class="pb-speed">' +
          '<button type="button" class="pb-btn pb-speed-btn" aria-haspopup="true" aria-expanded="false" aria-label="Playback speed">1×</button>' +
          '<div class="pb-speed-menu" role="menu">' +
            SPEEDS.map(function (s) { return '<button type="button" role="menuitemradio" aria-checked="' + (s === 1) + '" data-speed="' + s + '">' + s + '×</button>'; }).join('') +
          '</div>' +
        '</div>' +
        '<button type="button" class="pb-btn pb-full" aria-label="Full screen">' + ICONS.full + '</button>' +
      '</div>');

    var playBtn = player.querySelector('.pb-play');
    var seek = player.querySelector('.pb-seek');
    var cur = player.querySelector('.pb-cur');
    var dur = player.querySelector('.pb-dur');
    var speedBtn = player.querySelector('.pb-speed-btn');
    var speedMenu = player.querySelector('.pb-speed-menu');
    var fullBtn = player.querySelector('.pb-full');
    var scrubbing = false;
    var hideTimer = null;
    var speed = 1;

    function toggle() { if (video.paused) video.play(); else video.pause(); }

    // Browsers may reset playbackRate when the media loads or starts, so the chosen
    // speed is stored and re-applied on every relevant event, not only on click.
    function applySpeed() {
      if (video.playbackRate !== speed) video.playbackRate = speed;
      video.defaultPlaybackRate = speed;
    }

    function setSpeed(s) {
      speed = s;
      applySpeed();
      speedBtn.textContent = s + '×';
      speedMenu.querySelectorAll('button').forEach(function (b) {
        b.setAttribute('aria-checked', String(parseFloat(b.dataset.speed) === s));
      });
      closeMenu();
    }

    ['loadedmetadata', 'loadeddata', 'canplay', 'play', 'playing', 'seeked'].forEach(function (ev) {
      video.addEventListener(ev, applySpeed);
    });

    function openMenu() { speedMenu.classList.add('is-open'); speedBtn.setAttribute('aria-expanded', 'true'); }
    function closeMenu() { speedMenu.classList.remove('is-open'); speedBtn.setAttribute('aria-expanded', 'false'); }

    function showBar() {
      player.classList.add('is-active');
      clearTimeout(hideTimer);
      if (!video.paused) hideTimer = setTimeout(function () { player.classList.remove('is-active'); closeMenu(); }, 2200);
    }

    playBtn.addEventListener('click', toggle);
    video.addEventListener('click', toggle);
    video.setAttribute('aria-label', label);

    video.addEventListener('play', function () {
      player.classList.remove('is-paused');
      playBtn.innerHTML = ICONS.pause;
      playBtn.setAttribute('aria-label', 'Pause');
      showBar();
    });
    video.addEventListener('pause', function () {
      player.classList.add('is-paused');
      playBtn.innerHTML = ICONS.play;
      playBtn.setAttribute('aria-label', 'Play');
      showBar();
    });

    video.addEventListener('loadedmetadata', function () {
      dur.textContent = fmt(video.duration);
    });
    video.addEventListener('durationchange', function () { dur.textContent = fmt(video.duration); });
    video.addEventListener('timeupdate', function () {
      if (!scrubbing && isFinite(video.duration)) {
        seek.value = Math.round(video.currentTime / video.duration * 1000);
        seek.style.setProperty('--p', (video.currentTime / video.duration * 100) + '%');
      }
      cur.textContent = fmt(video.currentTime);
    });

    seek.addEventListener('pointerdown', function () { scrubbing = true; });
    seek.addEventListener('input', function () {
      if (!isFinite(video.duration)) return;
      var t = seek.value / 1000 * video.duration;
      cur.textContent = fmt(t);
      seek.style.setProperty('--p', (seek.value / 10) + '%');
      if (!scrubbing) video.currentTime = t;
    });
    seek.addEventListener('change', function () {
      if (isFinite(video.duration)) video.currentTime = seek.value / 1000 * video.duration;
      scrubbing = false;
    });
    seek.addEventListener('pointerup', function () { scrubbing = false; });

    speedBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      speedMenu.classList.contains('is-open') ? closeMenu() : openMenu();
      showBar();
    });
    speedMenu.addEventListener('click', function (e) {
      var b = e.target.closest('button[data-speed]');
      if (b) setSpeed(parseFloat(b.dataset.speed));
    });
    document.addEventListener('click', function (e) {
      if (!player.contains(e.target)) closeMenu();
    });

    fullBtn.addEventListener('click', function () {
      if (fsElement() === player) {
        (document.exitFullscreen || document.webkitExitFullscreen).call(document);
      } else if (player.requestFullscreen) {
        player.requestFullscreen();
      } else if (player.webkitRequestFullscreen) {
        player.webkitRequestFullscreen();
      } else if (video.webkitEnterFullscreen) {
        video.webkitEnterFullscreen(); // iPhone: only the video element can go full screen
      }
    });
    ['fullscreenchange', 'webkitfullscreenchange'].forEach(function (ev) {
      document.addEventListener(ev, function () {
        var on = fsElement() === player;
        player.classList.toggle('is-fullscreen', on);
        fullBtn.innerHTML = on ? ICONS.exit : ICONS.full;
        fullBtn.setAttribute('aria-label', on ? 'Exit full screen' : 'Full screen');
      });
    });

    // Clips start with preload="none" so the page does not fetch nine videos at once.
    // Fetch metadata (duration, first frame) only once a clip scrolls near the viewport.
    if ('IntersectionObserver' in window && video.preload === 'none') {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (!en.isIntersecting) return;
          io.disconnect();
          if (video.paused && video.readyState === 0) {
            video.preload = 'metadata';
            video.load();
          }
        });
      }, { rootMargin: '250px 0px' });
      io.observe(player);
    }

    player.addEventListener('pointermove', showBar);
    player.addEventListener('pointerleave', function () {
      if (!video.paused) { player.classList.remove('is-active'); closeMenu(); }
    });
    player.addEventListener('focusin', showBar);
    player.addEventListener('keydown', function (e) {
      if (e.target === seek) return;
      if (e.key === ' ' || e.key === 'k') { e.preventDefault(); toggle(); }
      else if (e.key === 'f') { e.preventDefault(); fullBtn.click(); }
      else if (e.key === 'ArrowRight') { video.currentTime = Math.min(video.duration || 0, video.currentTime + 5); }
      else if (e.key === 'ArrowLeft') { video.currentTime = Math.max(0, video.currentTime - 5); }
    });
    player.tabIndex = -1;
  });
})();
