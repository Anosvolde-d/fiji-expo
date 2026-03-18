/* ============================================
   FIJI EXPO — Script
   Slide system, counters, lightbox, socket.io
   ============================================ */

(function () {
    'use strict';

    // --- Slide System ---
    const slides = Array.from(document.querySelectorAll('.slide'));
    let current = 0;
    let transitioning = false;

    function goToSlide(index) {
        if (index < 0 || index >= slides.length || index === current || transitioning) return;
        transitioning = true;
        const dir = index > current ? 'up' : 'down';
        const prev = slides[current];
        const next = slides[index];

        prev.classList.add(dir === 'up' ? 'exit-up' : 'exit-down');
        prev.classList.remove('active');

        next.classList.add('active');
        current = index;

        // Trigger stat counters on stats slide
        if (next.classList.contains('stats-section')) {
            next.querySelectorAll('.stat-number').forEach(el => {
                animateCounter(el, parseInt(el.dataset.target));
            });
        }

        setTimeout(() => {
            prev.classList.remove('exit-up', 'exit-down');
            transitioning = false;
        }, 750);
    }

    // Init first slide
    if (slides[0]) slides[0].classList.add('active');

    // --- Counter Animation ---
    function animateCounter(el, target) {
        const inc = target / 125; // ~2s at 60fps
        let val = 0;
        el.textContent = '0';
        const timer = setInterval(() => {
            val += inc;
            if (val >= target) {
                el.textContent = target.toLocaleString();
                clearInterval(timer);
            } else {
                el.textContent = Math.floor(val).toLocaleString();
            }
        }, 16);
    }

    // --- Lightbox ---
    const lightbox = document.getElementById('lightbox');
    const lbImg = lightbox?.querySelector('.lightbox-image');
    const galleryItems = Array.from(document.querySelectorAll('.gallery-item img'));
    let lbIndex = 0;

    function openLightbox(i) {
        lbIndex = i;
        if (lbImg && galleryItems[i]) {
            lbImg.src = galleryItems[i].src;
            lbImg.alt = galleryItems[i].alt;
            lightbox.classList.add('open');
            lightbox.setAttribute('aria-hidden', 'false');
        }
    }

    function closeLightbox() {
        lightbox?.classList.remove('open');
        lightbox?.setAttribute('aria-hidden', 'true');
    }

    galleryItems.forEach((img, i) => {
        img.closest('.gallery-item')?.addEventListener('click', () => openLightbox(i));
        img.closest('.gallery-item')?.addEventListener('keydown', e => {
            if (e.key === 'Enter') openLightbox(i);
        });
    });

    lightbox?.querySelector('.lightbox-close')?.addEventListener('click', closeLightbox);
    lightbox?.querySelector('.lightbox-prev')?.addEventListener('click', () => {
        openLightbox((lbIndex - 1 + galleryItems.length) % galleryItems.length);
    });
    lightbox?.querySelector('.lightbox-next')?.addEventListener('click', () => {
        openLightbox((lbIndex + 1) % galleryItems.length);
    });

    // Close on backdrop click
    lightbox?.addEventListener('click', e => {
        if (e.target === lightbox) closeLightbox();
    });

    // --- Disable scroll, keyboard nav ---
    document.addEventListener('wheel', e => e.preventDefault(), { passive: false });
    document.addEventListener('touchmove', e => e.preventDefault(), { passive: false });
    document.addEventListener('keydown', e => {
        if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Space', 'Home', 'End'].includes(e.key)) {
            e.preventDefault();
        }
        if (e.key === 'Escape') closeLightbox();
    });

    // --- Socket.IO ---
    if (typeof io !== 'undefined') {
        const socket = io();

        socket.on('connect', () => console.log('Connected:', socket.id));

        socket.on('fileChanged', () => setTimeout(() => location.reload(), 100));

        socket.on('slideChanged', i => goToSlide(i));

        // Music
        let audio = null;
        const musicUrl = 'https://cdn.jsdelivr.net/gh/Anosvolde-d/fiji-expo@df432fe45a765c40cb663ca004a3708969fd14ec/bnj-msv_vt1s-ika-rmx.mp3';

        function getAudio() {
            if (!audio) {
                audio = new Audio(musicUrl);
                audio.loop = true;
                audio.volume = 0.5;
            }
            return audio;
        }

        socket.on('musicToggle', async playing => {
            const a = getAudio();
            if (playing) { a.currentTime = 9; await a.play().catch(() => {}); }
            else a.pause();
        });

        // Stats background toggle
        socket.on('statsBgChanged', pattern => {
            const s = document.querySelector('.stats-section');
            if (s) s.classList.toggle('bg-pattern-2', pattern === 2);
        });

        // Video fullscreen toggle
        socket.on('videoFullscreenChanged', data => {
            const card = document.querySelector(`.video-card[data-video-id="${data.videoId}"]`);
            if (card) card.classList.toggle('fullscreen', data.isFullscreen);
        });

        // Enable audio on first interaction
        document.addEventListener('click', () => getAudio(), { once: true });
    }

    // Expose for remote
    window.goToSlide = goToSlide;
    window.slideCount = slides.length;
})();
