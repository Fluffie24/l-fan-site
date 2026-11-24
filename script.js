document.addEventListener('DOMContentLoaded', () => {
    /* ============ PLAYFUL FLOATING SKY PARTICLES ============ */
    const sparklesRoot = document.getElementById('sky-sparkles');
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (sparklesRoot && !prefersReducedMotion) {
        const iconClasses = [
            'fas fa-star',
            'fas fa-feather-pointed',
            'fas fa-wand-magic-sparkles',
            'fas fa-heart',
            'fas fa-dove',
        ];
        const colors = ['#38BDF8', '#0EA5E9', '#F472B6', '#FBBF24', '#60A5FA'];
        const count = window.innerWidth <= 768 ? 8 : 14;
        for (let i = 0; i < count; i += 1) {
            const sp = document.createElement('i');
            sp.className = `sky-particle ${iconClasses[i % iconClasses.length]}`;
            sp.setAttribute('aria-hidden', 'true');
            sp.style.color = colors[i % colors.length];
            sp.style.left = `${(i * (100 / count) + Math.random() * 6).toFixed(1)}vw`;
            sp.style.fontSize = `${(11 + Math.random() * 10).toFixed(0)}px`;
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
    const spyNavLinks = document.querySelectorAll('.nav-links a[href^="#"], .mobile-nav-links a[href^="#"]');

    function handleScroll() {
        const y = window.scrollY;
        if (nav && !nav.dataset.alwaysSolid) {
            nav.classList.toggle('scrolled', y > 80);
        }
        if (backToTopBtn) {
            backToTopBtn.classList.toggle('visible', y > 420);
        }

        if (spySections.length > 0 && spyNavLinks.length > 0) {
            let currentId = 'hero';
            spySections.forEach((sec) => {
                const top = sec.offsetTop - 160;
                if (y >= top) {
                    currentId = sec.id;
                }
            });
            spyNavLinks.forEach((link) => {
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
    const revealEls = Array.from(document.querySelectorAll('.reveal'));
    function revealInViewport() {
        const thresholdY = window.innerHeight + 100;
        revealEls.forEach((el) => {
            if (!el.classList.contains('is-visible')) {
                const rect = el.getBoundingClientRect();
                if (rect.top <= thresholdY && rect.bottom >= -100) {
                    el.classList.add('is-visible');
                }
            }
        });
    }

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
            { threshold: 0, rootMargin: '100px 0px 100px 0px' }
        );
        revealEls.forEach((el) => revealObserver.observe(el));
        window.addEventListener('scroll', revealInViewport, { passive: true });
        window.addEventListener('resize', revealInViewport, { passive: true });
        window.addEventListener('load', revealInViewport, { passive: true });
        revealInViewport();
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

    /* ============ MOBILE FACTS CAROUSEL DOTS ============ */
    const factsGrid = document.querySelector('.facts-grid');
    const factsDotsRoot = document.getElementById('facts-dots');
    if (factsGrid && factsDotsRoot) {
        const factCards = Array.from(factsGrid.querySelectorAll('.fact-card'));
        const dots = factCards.map((_, idx) => {
            const dot = document.createElement('button');
            dot.type = 'button';
            dot.className = idx === 0 ? 'fact-dot active' : 'fact-dot';
            dot.setAttribute('aria-label', `Fact ${idx + 1}`);
            dot.addEventListener('click', () => {
                factCards[idx].scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });
            });
            factsDotsRoot.appendChild(dot);
            return dot;
        });

        let dotRaf = null;
        const updateActiveFactDot = () => {
            dotRaf = null;
            const gridRect = factsGrid.getBoundingClientRect();
            let closestIdx = 0;
            let closestDist = Infinity;
            factCards.forEach((card, idx) => {
                const dist = Math.abs(card.getBoundingClientRect().left - gridRect.left);
                if (dist < closestDist) {
                    closestDist = dist;
                    closestIdx = idx;
                }
            });
            dots.forEach((d, idx) => d.classList.toggle('active', idx === closestIdx));
        };

        factsGrid.addEventListener('scroll', () => {
            if (!dotRaf) {
                dotRaf = requestAnimationFrame(updateActiveFactDot);
            }
        }, { passive: true });
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
        const discTabs = document.querySelectorAll('.disc-tab');
        const songPills = document.querySelectorAll('#discography-pills .song-pill');
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

            songPills.forEach((pill) => {
                const isMatch = Number(pill.dataset.highlightIdx) === currentIndex;
                pill.classList.toggle('active', isMatch);
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

    /* ============ IAM48 NATIVE LIVE STATS & CATCH-UP WIDGET ============ */
    const iam48Widget = document.getElementById('iam48-widget');
    if (iam48Widget) {
        const gridEl = document.getElementById('iam48-grid');
        const statusEl = document.getElementById('iam48-status');
        const statusMsgEl = document.getElementById('iam48-status-msg');
        const retryBtn = document.getElementById('iam48-retry-btn');
        const footerEl = document.getElementById('iam48-footer');
        const moreBtn = document.getElementById('iam48-more-btn');
        const metaEl = document.getElementById('iam48-catchup-meta');
        const livePillEl = document.getElementById('iam48-live-pill');
        const bannerBgEl = document.getElementById('iam48-banner-bg');
        const avatarEl = document.getElementById('iam48-avatar');
        const nameEl = document.getElementById('iam48-name');
        const captionEl = document.getElementById('iam48-caption');

        const PAGE_SIZE = 6;
        let loadedCount = 0;
        let hasMore = false;
        let isLoading = false;
        let initialized = false;

        const compactFormatter = new Intl.NumberFormat('en', {
            notation: 'compact',
            maximumFractionDigits: 1,
        });
        const exactFormatter = new Intl.NumberFormat('en');
        const dateFormatter = new Intl.DateTimeFormat('en-GB', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            timeZone: 'Asia/Bangkok',
        });
        const timeFormatter = new Intl.DateTimeFormat('en-GB', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
            timeZone: 'Asia/Bangkok',
        });

        function formatReplayTimestamp(isoString) {
            if (!isoString) return '';
            const date = new Date(isoString);
            if (Number.isNaN(date.getTime())) return '';
            return `${dateFormatter.format(date)} · ${timeFormatter.format(date)}`;
        }

        function createReplayCard(video) {
            const link = document.createElement('a');
            link.className = 'iam48-replay-card';
            link.href = video.url;
            link.target = '_blank';
            link.rel = 'noopener noreferrer';

            const timestampLabel = formatReplayTimestamp(video.publishedAt);
            const ariaTitle = video.title
                ? `Watch "${video.title}" (${timestampLabel}) on iAM48`
                : `Watch L BNK48 live replay (${timestampLabel}) on iAM48`;
            link.setAttribute('aria-label', ariaTitle);

            if (video.thumbnail) {
                const img = document.createElement('img');
                img.src = video.thumbnail;
                img.alt = video.title || `L BNK48 iAM48 live ${timestampLabel}`;
                img.width = 300;
                img.height = 400;
                img.loading = 'lazy';
                img.decoding = 'async';
                link.appendChild(img);
            }

            const scrim = document.createElement('div');
            scrim.className = 'iam48-replay-scrim';
            scrim.setAttribute('aria-hidden', 'true');
            link.appendChild(scrim);

            if (video.isLive) {
                const liveBadge = document.createElement('span');
                liveBadge.className = 'iam48-replay-badge is-live';
                liveBadge.textContent = 'LIVE';
                link.appendChild(liveBadge);
            }

            const playCircle = document.createElement('span');
            playCircle.className = 'iam48-replay-play';
            playCircle.setAttribute('aria-hidden', 'true');
            const playIconEl = document.createElement('i');
            playIconEl.className = 'fas fa-play';
            playCircle.appendChild(playIconEl);
            link.appendChild(playCircle);

            const info = document.createElement('div');
            info.className = 'iam48-replay-info';

            if (video.title) {
                const titleEl = document.createElement('span');
                titleEl.className = 'iam48-replay-title';
                titleEl.textContent = video.title;
                info.appendChild(titleEl);
            }

            if (timestampLabel) {
                const dateEl = document.createElement('span');
                dateEl.className = 'iam48-replay-date';
                dateEl.textContent = timestampLabel;
                info.appendChild(dateEl);
            }

            link.appendChild(info);
            return link;
        }

        function applyProfile(profile) {
            if (!profile) return;
            if (profile.displayName && nameEl) {
                nameEl.textContent = `${profile.displayName} BNK48`;
            }
            if (profile.caption && captionEl) {
                captionEl.textContent = profile.caption;
                captionEl.title = profile.caption;
            }
            if (profile.avatar && avatarEl) {
                avatarEl.src = profile.avatar;
            }
            if (profile.cover && bannerBgEl) {
                bannerBgEl.style.backgroundImage = `url("${profile.cover}")`;
            }
            if (profile.stats) {
                Object.entries(profile.stats).forEach(([key, value]) => {
                    const dd = iam48Widget.querySelector(`[data-stat="${key}"]`);
                    if (dd && typeof value === 'number' && Number.isFinite(value)) {
                        dd.textContent = compactFormatter.format(value);
                        dd.title = exactFormatter.format(value);
                    }
                });
            }
        }

        function renderSkeletons(count) {
            if (!gridEl) return;
            const nodes = Array.from({ length: count }, () => {
                const el = document.createElement('div');
                el.className = 'iam48-skeleton';
                el.setAttribute('aria-hidden', 'true');
                return el;
            });
            gridEl.replaceChildren(...nodes);
            gridEl.hidden = false;
            gridEl.setAttribute('aria-busy', 'true');
        }

        async function fetchIam48Page(skip) {
            const params = new URLSearchParams({
                skip: String(skip),
                take: String(PAGE_SIZE),
            });
            const fetchOptions = {
                headers: { Accept: 'application/json' },
            };
            if (typeof AbortSignal !== 'undefined' && typeof AbortSignal.timeout === 'function') {
                fetchOptions.signal = AbortSignal.timeout(9000);
            }
            const response = await fetch(`/api/iam48?${params.toString()}`, fetchOptions);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            return response.json();
        }

        async function loadIam48(isLoadMore = false) {
            if (isLoading) return;
            isLoading = true;

            if (!isLoadMore) {
                loadedCount = 0;
                if (statusEl) statusEl.hidden = true;
                if (footerEl) footerEl.hidden = true;
                renderSkeletons(PAGE_SIZE);
                if (metaEl) metaEl.textContent = 'กำลังโหลดรายการไลฟ์...';
            } else if (moreBtn) {
                moreBtn.disabled = true;
                moreBtn.textContent = 'กำลังโหลด...';
            }

            try {
                const data = await fetchIam48Page(isLoadMore ? loadedCount : 0);
                if (!isLoadMore && data.profile) {
                    applyProfile(data.profile);
                }

                const videos = Array.isArray(data.videos) ? data.videos : [];
                hasMore = Boolean(data.hasMore);

                if (!isLoadMore) {
                    const isCurrentlyLive = videos.some((v) => v.isLive);
                    if (livePillEl) livePillEl.hidden = !isCurrentlyLive;
                }

                if (gridEl) {
                    const cards = videos.map(createReplayCard);
                    if (!isLoadMore) {
                        if (cards.length > 0) {
                            gridEl.replaceChildren(...cards);
                            gridEl.hidden = false;
                            if (statusEl) statusEl.hidden = true;
                        } else {
                            gridEl.replaceChildren();
                            gridEl.hidden = true;
                            if (statusMsgEl) {
                                statusMsgEl.textContent = 'ยังไม่มีรายการไลฟ์ย้อนหลังบน iAM48';
                            }
                            if (statusEl) statusEl.hidden = false;
                        }
                    } else if (cards.length > 0) {
                        const fragment = document.createDocumentFragment();
                        cards.forEach((card) => fragment.appendChild(card));
                        gridEl.appendChild(fragment);
                    }
                    gridEl.setAttribute('aria-busy', 'false');
                }

                loadedCount += videos.length;
                if (metaEl) {
                    metaEl.textContent = loadedCount > 0
                        ? `แสดง ${loadedCount} ไลฟ์ล่าสุด (เวลาประเทศไทย)`
                        : 'ไม่พบรายการไลฟ์';
                }

                if (footerEl) {
                    footerEl.hidden = !hasMore;
                }
                if (moreBtn) {
                    moreBtn.disabled = false;
                    moreBtn.replaceChildren(
                        document.createTextNode('โหลดย้อนหลังเพิ่มเติม '),
                        Object.assign(document.createElement('i'), {
                            className: 'fas fa-chevron-down',
                        })
                    );
                    const icon = moreBtn.querySelector('i');
                    if (icon) icon.setAttribute('aria-hidden', 'true');
                }
            } catch (err) {
                const isTimeout = err instanceof DOMException && err.name === 'TimeoutError';
                if (!isLoadMore) {
                    if (gridEl) {
                        gridEl.replaceChildren();
                        gridEl.hidden = true;
                        gridEl.setAttribute('aria-busy', 'false');
                    }
                    if (metaEl) metaEl.textContent = 'โหลดข้อมูลไม่สำเร็จ';
                    if (statusMsgEl) {
                        statusMsgEl.textContent = isTimeout
                            ? 'เชื่อมต่อ iAM48 ช้าเกินกำหนด กรุณาลองอีกครั้งหรือเปิดหน้า iAM48 โดยตรง'
                            : 'ไม่สามารถโหลดข้อมูลจาก iAM48 ได้ในขณะนี้ กรุณาลองอีกครั้งหรือเปิดหน้า iAM48 โดยตรง';
                    }
                    if (statusEl) statusEl.hidden = false;
                    if (footerEl) footerEl.hidden = true;
                } else if (moreBtn) {
                    moreBtn.disabled = false;
                    moreBtn.textContent = 'โหลดไม่สำเร็จ · ลองอีกครั้ง';
                }
            } finally {
                isLoading = false;
            }
        }

        if (retryBtn) {
            retryBtn.addEventListener('click', () => loadIam48(false));
        }
        if (moreBtn) {
            moreBtn.addEventListener('click', () => loadIam48(true));
        }

        const startLoad = () => {
            if (initialized) return;
            initialized = true;
            loadIam48(false);
        };

        if ('IntersectionObserver' in window) {
            const widgetObserver = new IntersectionObserver(
                (entries, obs) => {
                    if (entries.some((entry) => entry.isIntersecting)) {
                        obs.disconnect();
                        startLoad();
                    }
                },
                { rootMargin: '260px 0px' }
            );
            widgetObserver.observe(iam48Widget);
        } else {
            startLoad();
        }
    }

    /* ============ COMPACT GALLERY STRIP & NATIVE <DIALOG> LIGHTBOX ============ */
    const galleryStrip = document.getElementById('gallery-strip');
    const galleryDialog = document.getElementById('gallery-lightbox');
    if (galleryStrip) {
        const galleryTabs = document.querySelectorAll('.gallery-tab');
        const galleryTiles = Array.from(galleryStrip.querySelectorAll('.gallery-tile'));
        const galleryCountEl = document.getElementById('gallery-count');
        const prevScrollBtn = document.getElementById('gallery-prev');
        const nextScrollBtn = document.getElementById('gallery-next');

        const lbImg = document.getElementById('lightbox-img');
        const lbTitle = document.getElementById('lightbox-title');
        const lbCat = document.getElementById('lightbox-cat');
        const lbCounter = document.getElementById('lightbox-counter');
        const lbClose = document.getElementById('lightbox-close');
        const lbPrev = document.getElementById('lightbox-prev');
        const lbNext = document.getElementById('lightbox-next');

        let visibleTiles = galleryTiles;
        let activeLightboxIdx = 0;

        function applyGalleryFilter(filter) {
            visibleTiles = galleryTiles.filter((tile) => {
                const match = filter === 'all' || tile.dataset.category === filter;
                tile.hidden = !match;
                return match;
            });
            if (galleryCountEl) {
                galleryCountEl.textContent = `${visibleTiles.length} รูป`;
            }
            galleryStrip.scrollTo({ left: 0, behavior: 'smooth' });
        }

        galleryTabs.forEach((tab) => {
            tab.addEventListener('click', () => {
                const filter = tab.dataset.galleryFilter || 'all';
                galleryTabs.forEach((t) => {
                    const isActive = t === tab;
                    t.classList.toggle('active', isActive);
                    t.setAttribute('aria-selected', String(isActive));
                });
                applyGalleryFilter(filter);
            });
        });

        const scrollStep = () => Math.max(240, Math.round(galleryStrip.clientWidth * 0.72));
        if (prevScrollBtn) {
            prevScrollBtn.addEventListener('click', () => {
                galleryStrip.scrollBy({ left: -scrollStep(), behavior: 'smooth' });
            });
        }
        if (nextScrollBtn) {
            nextScrollBtn.addEventListener('click', () => {
                galleryStrip.scrollBy({ left: scrollStep(), behavior: 'smooth' });
            });
        }

        function showLightboxAt(index) {
            if (!galleryDialog || visibleTiles.length === 0) return;
            const total = visibleTiles.length;
            activeLightboxIdx = (index + total) % total;
            const tile = visibleTiles[activeLightboxIdx];
            const src = tile.dataset.full || tile.querySelector('img')?.src || '';
            const label = tile.dataset.label || 'L BNK48';
            const catLabel = tile.dataset.catLabel || 'Gallery';

            if (lbImg) {
                lbImg.src = src;
                lbImg.alt = `${label} — L BNK48`;
            }
            if (lbTitle) lbTitle.textContent = label;
            if (lbCat) lbCat.textContent = catLabel;
            if (lbCounter) {
                lbCounter.textContent = `${String(activeLightboxIdx + 1).padStart(2, '0')} / ${String(total).padStart(2, '0')}`;
            }
        }

        galleryTiles.forEach((tile) => {
            tile.addEventListener('click', () => {
                const idx = visibleTiles.indexOf(tile);
                if (idx === -1 || !galleryDialog) return;
                showLightboxAt(idx);
                if (!galleryDialog.open) {
                    galleryDialog.showModal();
                }
            });
        });

        if (galleryDialog) {
            if (lbClose) {
                lbClose.addEventListener('click', () => galleryDialog.close());
            }
            if (lbPrev) {
                lbPrev.addEventListener('click', () => showLightboxAt(activeLightboxIdx - 1));
            }
            if (lbNext) {
                lbNext.addEventListener('click', () => showLightboxAt(activeLightboxIdx + 1));
            }

            // Fallback for browsers without <dialog closedby="any"> support (e.g., Safari)
            if (!('closedBy' in HTMLDialogElement.prototype)) {
                galleryDialog.addEventListener('click', (event) => {
                    if (event.target !== galleryDialog) return;
                    const rect = galleryDialog.getBoundingClientRect();
                    const isDialogContent =
                        rect.top <= event.clientY &&
                        event.clientY <= rect.top + rect.height &&
                        rect.left <= event.clientX &&
                        event.clientX <= rect.left + rect.width;
                    if (!isDialogContent) {
                        galleryDialog.close();
                    }
                });
            }

            galleryDialog.addEventListener('keydown', (event) => {
                if (event.key === 'ArrowLeft') {
                    event.preventDefault();
                    showLightboxAt(activeLightboxIdx - 1);
                } else if (event.key === 'ArrowRight') {
                    event.preventDefault();
                    showLightboxAt(activeLightboxIdx + 1);
                }
            });
        }
    }

    /* ============ GLOBAL ESCAPE KEY HANDLER ============ */
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            if (mobileMenu && mobileMenu.classList.contains('active')) {
                setMenuOpen(false);
            }
        }
    });
});
