document.addEventListener('DOMContentLoaded', () => {
    /* ============ PLAYFUL FLOATING SKY PARTICLES ============ */
    const sparklesRoot = document.getElementById('sky-sparkles');
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (sparklesRoot && !prefersReducedMotion) {
        const items = ['✦', '🪽', '✨', '💙', '⋆'];
        const colors = ['#38BDF8', '#0EA5E9', '#F472B6', '#FBBF24', '#60A5FA'];
        const count = window.innerWidth <= 768 ? 8 : 14;
        for (let i = 0; i < count; i += 1) {
            const sp = document.createElement('span');
            sp.className = 'sky-particle';
            sp.textContent = items[i % items.length];
            sp.style.color = colors[i % colors.length];
            sp.style.left = `${(i * (100 / count) + Math.random() * 6).toFixed(1)}vw`;
            sp.style.fontSize = `${(11 + Math.random() * 11).toFixed(0)}px`;
            sp.style.animationDuration = `${(11 + Math.random() * 11).toFixed(1)}s`;
            sp.style.animationDelay = `${(-Math.random() * 18).toFixed(1)}s`;
            sparklesRoot.appendChild(sp);
        }
    }

    /* ============ MOBILE MENU ============ */
    const hamburger = document.getElementById('hamburger');
    const mobileMenu = document.getElementById('mobile-menu');
    const closeMenuBtn = document.getElementById('close-menu');
    const menuOverlay = document.getElementById('menu-overlay');
    const mobileLinks = document.querySelectorAll('.mobile-nav-links a');

    function setMenuOpen(isOpen) {
        if (!mobileMenu || !menuOverlay) return;
        mobileMenu.classList.toggle('active', isOpen);
        menuOverlay.classList.toggle('active', isOpen);
        mobileMenu.setAttribute('aria-hidden', String(!isOpen));
        document.body.classList.toggle('no-scroll', isOpen);
        if (hamburger) {
            hamburger.setAttribute('aria-expanded', String(isOpen));
        }
    }

    if (hamburger && mobileMenu && menuOverlay) {
        hamburger.addEventListener('click', () => {
            setMenuOpen(!mobileMenu.classList.contains('active'));
        });
        if (closeMenuBtn) {
            closeMenuBtn.addEventListener('click', () => setMenuOpen(false));
        }
        menuOverlay.addEventListener('click', () => setMenuOpen(false));
        mobileLinks.forEach((link) => {
            link.addEventListener('click', () => setMenuOpen(false));
        });
    }

    /* ============ NAVBAR SCROLL & SCROLL-SPY ============ */
    const nav = document.querySelector('nav');
    const backToTopBtn = document.getElementById('back-to-top');
    const spySections = document.querySelectorAll('header#hero, main section[id]');
    const desktopNavLinks = document.querySelectorAll('.nav-links a[href^="#"]');

    function handleScroll() {
        const y = window.scrollY;
        if (nav && !nav.dataset.alwaysSolid) {
            nav.classList.toggle('scrolled', y > 80);
        }
        if (backToTopBtn) {
            backToTopBtn.classList.toggle('visible', y > 420);
        }

        if (spySections.length > 0 && desktopNavLinks.length > 0) {
            let currentId = 'hero';
            spySections.forEach((sec) => {
                const top = sec.offsetTop - 160;
                if (y >= top) {
                    currentId = sec.id;
                }
            });
            desktopNavLinks.forEach((link) => {
                const isMatch = link.getAttribute('href') === `#${currentId}`;
                link.classList.toggle('active', isMatch);
            });
        }
    }

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    if (backToTopBtn) {
        backToTopBtn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    /* ============ SCROLL REVEAL ============ */
    const revealEls = document.querySelectorAll('.reveal');
    if (revealEls.length > 0 && 'IntersectionObserver' in window) {
        const revealObserver = new IntersectionObserver(
            (entries, obs) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('is-visible');
                        obs.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.08, rootMargin: '0px 0px -30px 0px' }
        );
        revealEls.forEach((el) => revealObserver.observe(el));
    } else {
        revealEls.forEach((el) => el.classList.add('is-visible'));
    }

    /* ============ VINYL BGM PLAYER ============ */
    const vinylWidget = document.getElementById('vinyl-widget');
    const vinylBtn = document.getElementById('vinyl-record');
    const playIcon = document.getElementById('play-btn');
    const audio = document.getElementById('bg-music');

    if (vinylBtn && audio) {
        audio.volume = 0.2;

        function syncAudioUI(playing) {
            if (vinylWidget) {
                vinylWidget.classList.toggle('playing', playing);
            }
            vinylBtn.setAttribute('aria-pressed', String(playing));
            vinylBtn.setAttribute(
                'aria-label',
                playing ? 'Pause background music' : 'Play background music'
            );
            if (playIcon) {
                playIcon.innerHTML = playing
                    ? '<i class="fas fa-pause"></i>'
                    : '<i class="fas fa-play"></i>';
            }
        }

        function toggleAudio() {
            if (audio.paused) {
                audio
                    .play()
                    .then(() => syncAudioUI(true))
                    .catch((err) => {
                        console.warn('Audio playback prevented:', err);
                        syncAudioUI(false);
                    });
            } else {
                audio.pause();
                syncAudioUI(false);
            }
        }

        vinylBtn.addEventListener('click', toggleAudio);
        audio.addEventListener('pause', () => syncAudioUI(false));
        audio.addEventListener('play', () => syncAudioUI(true));
    }

    /* ============ AUTO AGE CALCULATION ============ */
    const ageEl = document.getElementById('l-age');
    if (ageEl) {
        const now = new Date();
        let age = now.getFullYear() - 2003;
        const hadBirthday =
            now.getMonth() > 1 || (now.getMonth() === 1 && now.getDate() >= 13);
        if (!hadBirthday) {
            age -= 1;
        }
        ageEl.textContent = String(age);
    }

    /* ============ HIGHLIGHTS VIDEO SWITCHER (WITH COMING SOON SUPPORT) ============ */
    const mainImg = document.getElementById('main-video-img');
    const comingSoonStage = document.getElementById('coming-soon-stage');
    const playOverlay = document.getElementById('main-play-overlay');
    const videoThumbs = Array.from(document.querySelectorAll('.video-thumb'));

    if (videoThumbs.length > 0) {
        const mainLink = document.getElementById('main-video-link');
        const infoContainer = document.getElementById('video-info');
        const infoTag = document.getElementById('video-tag');
        const infoTitle = document.getElementById('video-title');
        const counterEl = document.getElementById('video-counter');
        let currentIndex = 0;
        let switchTimer = null;

        if (mainLink) {
            mainLink.addEventListener('click', (event) => {
                if (mainLink.classList.contains('is-coming-soon')) {
                    event.preventDefault();
                }
            });
        }

        if (mainImg) {
            mainImg.addEventListener('load', () => {
                if (mainImg.naturalWidth === 120 && mainImg.src.includes('maxresdefault.jpg')) {
                    mainImg.src = mainImg.src.replace('maxresdefault.jpg', 'hqdefault.jpg');
                }
            });
        }

        function setMainThumbnail(videoId, altText) {
            if (!mainImg) return;
            mainImg.alt = altText || 'Highlight preview';
            mainImg.onerror = () => {
                mainImg.onerror = null;
                mainImg.src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
            };
            mainImg.src = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
        }

        function selectVideo(index, shouldScrollIntoView = false) {
            const total = videoThumbs.length;
            currentIndex = (index + total) % total;
            const thumb = videoThumbs[currentIndex];
            const isComingSoon = thumb.dataset.comingSoon === 'true';
            const videoId = thumb.dataset.id;
            const tagText = thumb.dataset.tag || '';
            const titleText = thumb.dataset.title || '';

            if (isComingSoon) {
                if (comingSoonStage) comingSoonStage.hidden = false;
                if (mainImg) mainImg.hidden = true;
                if (playOverlay) playOverlay.hidden = true;
                if (mainLink) {
                    mainLink.href = '#highlights';
                    mainLink.removeAttribute('target');
                    mainLink.removeAttribute('rel');
                    mainLink.classList.add('is-coming-soon');
                    mainLink.setAttribute('aria-disabled', 'true');
                    mainLink.setAttribute('aria-label', `${titleText} Coming Soon`);
                }
            } else {
                if (comingSoonStage) comingSoonStage.hidden = true;
                if (mainImg) mainImg.hidden = false;
                if (playOverlay) playOverlay.hidden = false;
                setMainThumbnail(videoId, titleText);
                if (mainLink) {
                    mainLink.href = `https://www.youtube.com/watch?v=${videoId}`;
                    mainLink.setAttribute('target', '_blank');
                    mainLink.setAttribute('rel', 'noopener noreferrer');
                    mainLink.classList.remove('is-coming-soon');
                    mainLink.removeAttribute('aria-disabled');
                    mainLink.setAttribute('aria-label', `Watch ${titleText} on YouTube`);
                }
            }

            if (counterEl) {
                counterEl.textContent = `${String(currentIndex + 1).padStart(2, '0')} / ${String(total).padStart(2, '0')}`;
            }

            if (infoContainer) {
                infoContainer.classList.add('is-switching');
                clearTimeout(switchTimer);
                switchTimer = setTimeout(() => {
                    if (infoTag) infoTag.textContent = tagText;
                    if (infoTitle) infoTitle.textContent = titleText;
                    infoContainer.classList.remove('is-switching');
                }, 150);
            }

            videoThumbs.forEach((t, idx) => {
                const isActive = idx === currentIndex;
                t.classList.toggle('active', isActive);
                t.setAttribute('aria-selected', String(isActive));
            });

            if (shouldScrollIntoView) {
                thumb.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
            }
        }

        videoThumbs.forEach((thumb, idx) => {
            thumb.addEventListener('click', () => selectVideo(idx, true));
        });

        const scrollLeftBtn = document.getElementById('scroll-left');
        const scrollRightBtn = document.getElementById('scroll-right');
        if (scrollLeftBtn) {
            scrollLeftBtn.addEventListener('click', () => selectVideo(currentIndex - 1, true));
        }
        if (scrollRightBtn) {
            scrollRightBtn.addEventListener('click', () => selectVideo(currentIndex + 1, true));
        }

        /* Discography filter & quick-jump to matching Highlight */
        const discTabs = document.querySelectorAll('.disc-tab');
        const songPills = document.querySelectorAll('#discography-pills .song-pill');

        discTabs.forEach((tab) => {
            tab.addEventListener('click', () => {
                const filter = tab.dataset.filter;
                discTabs.forEach((t) => {
                    const isActive = t === tab;
                    t.classList.toggle('active', isActive);
                    t.setAttribute('aria-selected', String(isActive));
                });
                songPills.forEach((pill) => {
                    const show = filter === 'all' || pill.classList.contains('is-center');
                    pill.hidden = !show;
                });
            });
        });

        songPills.forEach((pill) => {
            const idxAttr = pill.dataset.highlightIdx;
            if (idxAttr !== undefined) {
                pill.addEventListener('click', () => {
                    const targetIdx = Number(idxAttr);
                    if (!Number.isNaN(targetIdx)) {
                        selectVideo(targetIdx, true);
                        const stage = document.querySelector('.highlights-stage');
                        if (stage) {
                            stage.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }
                    }
                });
            }
        });
    }

    /* ============ CLICK-TO-COPY WORK CONTACT ============ */
    const copyButtons = document.querySelectorAll('.copy-chip[data-copy]');
    copyButtons.forEach((btn) => {
        btn.addEventListener('click', async () => {
            const text = btn.dataset.copy;
            if (!text) return;
            const labelSpan = btn.querySelector('span');
            const copyIcon = btn.querySelector('.copy-icon');
            const originalText = labelSpan ? labelSpan.textContent : text;

            try {
                await navigator.clipboard.writeText(text);
            } catch {
                const tmp = document.createElement('textarea');
                tmp.value = text;
                tmp.style.position = 'fixed';
                tmp.style.opacity = '0';
                document.body.appendChild(tmp);
                tmp.select();
                document.execCommand('copy');
                tmp.remove();
            }

            btn.classList.add('copied');
            if (labelSpan) labelSpan.textContent = 'Copied!';
            if (copyIcon) copyIcon.className = 'fas fa-check copy-icon';

            clearTimeout(btn._copyTimer);
            btn._copyTimer = setTimeout(() => {
                btn.classList.remove('copied');
                if (labelSpan) labelSpan.textContent = originalText;
                if (copyIcon) copyIcon.className = 'far fa-copy copy-icon';
            }, 1600);
        });
    });

    /* ============ IMAGE LIGHTBOX MODAL (gallery.html) ============ */
    const modal = document.getElementById('image-modal');
    const modalImg = document.getElementById('full-image');
    const modalLink = document.getElementById('modal-post-link');
    const closeBtn = document.querySelector('.close-modal');
    const galleryImages = document.querySelectorAll('.gallery-grid img, .masonry-grid img');

    function closeImageModal() {
        if (!modal) return;
        modal.style.display = 'none';
        modal.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('no-scroll');
    }

    if (modal && modalImg && galleryImages.length > 0) {
        galleryImages.forEach((img) => {
            img.addEventListener('click', function () {
                modal.style.display = 'flex';
                modal.setAttribute('aria-hidden', 'false');
                document.body.classList.add('no-scroll');
                modalImg.src = this.src;
                modalImg.alt = this.alt || 'Full size preview';

                const postUrl = this.getAttribute('data-post-url');
                if (modalLink) {
                    if (postUrl) {
                        modalLink.href = postUrl;
                        modalLink.style.display = 'inline-flex';
                    } else {
                        modalLink.style.display = 'none';
                    }
                }
            });
        });

        if (closeBtn) {
            closeBtn.addEventListener('click', closeImageModal);
        }

        modal.addEventListener('click', (event) => {
            if (event.target === modal) {
                closeImageModal();
            }
        });
    }

    /* ============ GLOBAL ESCAPE KEY HANDLER ============ */
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            if (modal && modal.style.display === 'flex') {
                closeImageModal();
            }
            if (mobileMenu && mobileMenu.classList.contains('active')) {
                setMenuOpen(false);
            }
        }
    });
});
