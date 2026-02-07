document.addEventListener('DOMContentLoaded', () => {

    const hamburger = document.getElementById('hamburger');
    const mobileMenu = document.getElementById('mobile-menu');
    const closeMenu = document.getElementById('close-menu');
    const menuOverlay = document.getElementById('menu-overlay');
    const mobileLinks = document.querySelectorAll('.mobile-nav-links a');

    function toggleMenu() {
        mobileMenu.classList.toggle('active');
        menuOverlay.classList.toggle('active');
    }

    if (hamburger) {
        hamburger.addEventListener('click', toggleMenu);
        closeMenu.addEventListener('click', toggleMenu);
        menuOverlay.addEventListener('click', toggleMenu);
        
        mobileLinks.forEach(link => {
            link.addEventListener('click', toggleMenu);
        });
    }

    const playBtn = document.getElementById('play-btn');
    const vinyl = document.getElementById('vinyl-record');
    const audio = document.getElementById('bg-music');

    if (playBtn && vinyl && audio) {
        let isPlaying = false;

        function togglePlay() {
            if (isPlaying) {
                audio.pause();
                vinyl.classList.remove('spinning');
                playBtn.classList.remove('playing');
                playBtn.innerText = "▶";
                vinyl.setAttribute('aria-pressed', 'false');
            } else {
                audio.play().catch(error => {
                    console.log("Audio play failed: ", error);
                    alert("Please interact with the page first.");
                });
                vinyl.classList.add('spinning');
                playBtn.classList.add('playing');
                playBtn.innerText = "⏸";
                vinyl.setAttribute('aria-pressed', 'true');
            }
            isPlaying = !isPlaying;
        }

        vinyl.addEventListener('click', togglePlay);
        playBtn.addEventListener('click', (e) => { e.stopPropagation(); togglePlay(); });
        vinyl.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); togglePlay(); }
        });
    }

    const nav = document.querySelector('nav');
    if (nav) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 100) { 
                nav.classList.add('scrolled');
            } else {
                nav.classList.remove('scrolled');
            }
        });
    }

    const mainImg = document.getElementById('main-video-img');
    const videoThumbs = document.querySelectorAll('.video-thumb');

    if (mainImg && videoThumbs.length > 0) {
        const mainLink = document.getElementById('main-video-link');
        const infoContainer = document.getElementById('video-info');
        const infoTag = document.getElementById('video-tag');
        const infoTitle = document.getElementById('video-title');
        const infoDesc = document.getElementById('video-desc');

        videoThumbs.forEach(thumb => {
            thumb.addEventListener('click', () => {
                const videoId = thumb.getAttribute('data-id');
                const tagText = thumb.getAttribute('data-tag');
                const titleText = thumb.getAttribute('data-title');
                const descText = thumb.getAttribute('data-desc');

                mainImg.src = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
                mainLink.href = `https://www.youtube.com/watch?v=${videoId}`;

                infoContainer.style.opacity = '0';
                setTimeout(() => {
                    infoTag.innerHTML = `<i class="fas fa-star"></i> ${tagText}`;
                    infoTitle.innerText = titleText;
                    infoDesc.innerText = descText;
                    infoContainer.style.opacity = '1';
                }, 200);

                videoThumbs.forEach(t => t.classList.remove('active'));
                thumb.classList.add('active');
            });
        });

        const scrollLeftBtn = document.getElementById('scroll-left');
        const scrollRightBtn = document.getElementById('scroll-right');
        
        if (scrollLeftBtn && scrollRightBtn) {
            function updateActiveVideo(direction) {
                const thumbs = Array.from(document.querySelectorAll('.video-thumb'));
                const currentIndex = thumbs.findIndex(t => t.classList.contains('active'));
                let nextIndex;

                if (direction === 'next') {
                    nextIndex = (currentIndex + 1 >= thumbs.length) ? 0 : currentIndex + 1;
                } else {
                    nextIndex = (currentIndex - 1 < 0) ? thumbs.length - 1 : currentIndex - 1;
                }
                thumbs[nextIndex].click();
                thumbs[nextIndex].scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
            }

            scrollLeftBtn.onclick = () => updateActiveVideo('prev');
            scrollRightBtn.onclick = () => updateActiveVideo('next');
        }
    }

    const disclaimerPopup = document.getElementById('disclaimer-popup');
    if (disclaimerPopup) {
        const closeDisclaimerBtn = document.getElementById('close-disclaimer');
        
        function closeDisclaimer() {
            disclaimerPopup.style.opacity = '0';
            setTimeout(() => { disclaimerPopup.style.display = 'none'; }, 300); 
        }

        if (closeDisclaimerBtn) {
            closeDisclaimerBtn.addEventListener('click', closeDisclaimer);
        }
        setTimeout(closeDisclaimer, 5000);
    }

    const countdownElement = document.getElementById("countdown");
    if (countdownElement) {
        const targetDate = new Date("February 13, 2026 00:00:00").getTime();

        function updateCountdown() {
            const now = new Date().getTime();
            const difference = targetDate - now;

            if (difference < 0) {
                countdownElement.innerHTML = "<h3>HAPPY BIRTHDAY L!</h3>";
                return;
            }

            const d = Math.floor(difference / (1000 * 60 * 60 * 24));
            const h = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const m = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
            const s = Math.floor((difference % (1000 * 60)) / 1000);

            document.getElementById("days").innerText = d.toString().padStart(2, '0');
            document.getElementById("hours").innerText = h.toString().padStart(2, '0');
            document.getElementById("minutes").innerText = m.toString().padStart(2, '0');
            document.getElementById("seconds").innerText = s.toString().padStart(2, '0');
        }
        setInterval(updateCountdown, 1000);
        updateCountdown();
    }

    const modal = document.getElementById("image-modal");
    const modalImg = document.getElementById("full-image");
    const modalLink = document.getElementById("modal-post-link"); 
    const closeBtn = document.querySelector(".close-modal");
    
    const allGalleryImages = document.querySelectorAll('.announcement-photos img, .gallery-grid img, .masonry-grid img');

    if (modal && modalImg && allGalleryImages.length > 0) {
        allGalleryImages.forEach(img => {
            img.addEventListener('click', function() {
                modal.style.display = "flex";
                modal.style.alignItems = "center";
                modal.style.justifyContent = "center";
                
                modalImg.src = this.src; 

                const postUrl = this.getAttribute('data-post-url');

                if (modalLink) {
                    if (postUrl) {
                        modalLink.href = postUrl;
                        modalLink.style.display = "flex"; 
                        modalLink.style.alignItems = "center";
                        modalLink.style.gap = "8px";
                    } else {
                        modalLink.style.display = "none";
                    }
                }
            });
        });

        if (closeBtn) {
            closeBtn.onclick = function() { modal.style.display = "none"; }
        }
        
        modal.onclick = function(event) {
            if (event.target === modal) { modal.style.display = "none"; }
        }
    }
});