/* ══════════════════════════════════════
   HOME PAGE MOTION
   Layered parallax hero, word-by-word title, a marquee of what's on,
   scroll-lit mission words, tilting artwork cards and a progress line.
   Everything calms down for visitors who prefer reduced motion.
══════════════════════════════════════ */
(function () {
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

    /* ── Split text into words (keeps <br> and <em>) ── */
    function splitWords(el, wrap) {
        var index = 0;
        function walk(node) {
            Array.prototype.slice.call(node.childNodes).forEach(function (child) {
                if (child.nodeType === 3) {
                    var frag = document.createDocumentFragment();
                    child.textContent.split(/(\s+)/).forEach(function (part) {
                        if (!part) return;
                        if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
                        frag.appendChild(wrap(part, index++));
                    });
                    node.replaceChild(frag, child);
                } else if (child.nodeType === 1 && child.tagName !== 'BR') {
                    walk(child);
                }
            });
        }
        walk(el);
    }

    /* ── Hero title: each word rises into place ── */
    var h1 = document.querySelector('.hero h1');
    if (h1 && !reduce) {
        splitWords(h1, function (word, i) {
            var outer = document.createElement('span');
            outer.className = 'w';
            var inner = document.createElement('span');
            inner.textContent = word;
            inner.style.setProperty('--i', i);
            outer.appendChild(inner);
            return outer;
        });
    }

    /* ── Marquee of current and upcoming exhibitions ── */
    var track = document.getElementById('marqueeTrack');
    if (track) {
        var shows = EXHIBITIONS.filter(function (e) { return exStatus(e) !== 'past'; });
        var items = '<a class="marquee-label" href="exhibitions.html">Now on view</a>' + shows.map(function (e) {
            return '<a href="exhibition.html?id=' + e.id + '">' + esc(e.title) + '</a>';
        }).join('');
        /* two copies so the loop is seamless; the second is hidden from screen readers */
        track.innerHTML = '<div style="display:flex">' + items + '</div><div style="display:flex" aria-hidden="true">' + items.replace(/<a /g, '<a tabindex="-1" ') + '</div>';
    }

    /* ── Mission quote: words light up as the section scrolls past ── */
    var quote = document.querySelector('.mission blockquote');
    var quoteWords = [];
    if (quote && !reduce) {
        splitWords(quote, function (word) {
            var span = document.createElement('span');
            span.className = 'mw';
            span.textContent = word;
            return span;
        });
        quoteWords = quote.querySelectorAll('.mw');
    }

    /* ── Artwork cards: tilt toward the cursor with a soft spotlight ── */
    if (finePointer && !reduce) {
        document.querySelectorAll('#homeHighlights .art-media').forEach(function (media) {
            var spot = document.createElement('span');
            spot.className = 'spot';
            media.appendChild(spot);
            media.addEventListener('mousemove', function (e) {
                var r = media.getBoundingClientRect();
                var x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
                media.classList.add('tilting');
                media.style.transform = 'perspective(800px) rotateY(' + ((x - 0.5) * 10).toFixed(2) + 'deg) rotateX(' + ((0.5 - y) * 10).toFixed(2) + 'deg)';
                media.style.setProperty('--sx', (x * 100).toFixed(1) + '%');
                media.style.setProperty('--sy', (y * 100).toFixed(1) + '%');
            });
            media.addEventListener('mouseleave', function () {
                media.classList.remove('tilting');
                media.style.transform = '';
            });
        });
    }

    /* ── Scroll + pointer driven effects, batched into one frame ── */
    var layers = Array.prototype.slice.call(document.querySelectorAll('.hero-art .px'));
    var heroContent = document.querySelector('.hero-content');
    var hero = document.querySelector('.hero');
    var progress = document.getElementById('progress');
    var mx = 0, my = 0, ticking = false;

    function frame() {
        ticking = false;
        var y = window.scrollY;
        var vh = window.innerHeight;

        if (progress) {
            var max = document.documentElement.scrollHeight - vh;
            progress.style.transform = 'scaleX(' + (max > 0 ? Math.min(1, y / max) : 0) + ')';
        }
        if (reduce) return;

        if (hero && y < hero.offsetHeight + 100) {
            layers.forEach(function (g) {
                var d = parseFloat(g.getAttribute('data-depth'));
                g.style.transform = 'translate(' + (mx * d * -40).toFixed(1) + 'px,' + (y * d + my * d * -20).toFixed(1) + 'px)';
            });
            if (heroContent) {
                heroContent.style.transform = 'translateY(' + (y * 0.25).toFixed(1) + 'px)';
                heroContent.style.opacity = Math.max(0, 1 - y / (vh * 0.7)).toFixed(3);
            }
        }

        if (quoteWords.length && !document.documentElement.classList.contains('fp-on')) {
            var r = quote.getBoundingClientRect();
            /* fully lit by the time the quote reaches the upper third of the screen */
            var p = (vh * 0.85 - r.top) / (vh * 0.85 - vh * 0.3);
            var lit = Math.round(Math.max(0, Math.min(1, p)) * quoteWords.length);
            for (var i = 0; i < quoteWords.length; i++) quoteWords[i].classList.toggle('lit', i < lit);
        }
    }
    function request() { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }

    window.addEventListener('scroll', request, { passive: true });
    window.addEventListener('resize', request);
    if (hero && finePointer && !reduce) {
        hero.addEventListener('mousemove', function (e) {
            mx = e.clientX / window.innerWidth - 0.5;
            my = e.clientY / window.innerHeight - 0.5;
            request();
        });
    }
    frame();

    /* ══════════════════════════════════════
       FULL-PAGE PANELS
       Scrolling (wheel, keys, swipe, dots) slides one whole panel at a time.
       A panel that is taller than the screen scrolls normally first and
       only moves on once its edge is reached.
    ══════════════════════════════════════ */
    var trackEl = document.getElementById('fpTrack');
    var panels = trackEl ? Array.prototype.slice.call(trackEl.querySelectorAll('.panel')) : [];
    if (!panels.length || reduce) return;

    var root = document.documentElement;
    root.classList.add('fp-on');
    window.scrollTo(0, 0);

    var header = document.getElementById('siteHeader');
    var dotsNav = document.getElementById('fpDots');
    var current = 0, animating = false, lastWheel = 0, litTimer = null;
    var DURATION = 1050;

    dotsNav.innerHTML = panels.map(function (pnl, i) {
        return '<button type="button" class="fp-dot" data-goto="' + i + '" aria-label="' + pnl.getAttribute('data-label') + '"><span>' + pnl.getAttribute('data-label') + '</span></button>';
    }).join('');
    var dots = dotsNav.querySelectorAll('.fp-dot');

    function place(animate) {
        trackEl.style.transition = animate ? '' : 'none';
        trackEl.style.transform = 'translate3d(0,' + (-current * window.innerHeight) + 'px,0)';
        if (!animate) { void trackEl.offsetHeight; trackEl.style.transition = ''; }
    }

    function restart(el) { el.style.animation = 'none'; void el.offsetWidth; el.style.animation = ''; }

    /* hide a panel's contents instantly (it is off screen), ready to fade in again */
    function resetPanel(pnl) {
        pnl.classList.add('resetting');
        pnl.classList.remove('shown');
        pnl.querySelectorAll('.reveal').forEach(function (r) { r.classList.remove('in'); });
        pnl.querySelectorAll('.mw').forEach(function (w) { w.classList.remove('lit'); });
        pnl.scrollTop = 0;
        void pnl.offsetHeight;
        pnl.classList.remove('resetting');
    }

    function showPanel(pnl) {
        pnl.classList.add('shown');
        pnl.querySelectorAll('.reveal').forEach(function (r) { r.classList.add('in'); });
        if (pnl.classList.contains('panel-hero')) {
            pnl.querySelectorAll('.intro, h1 .w > span').forEach(restart);
        }
        var words = pnl.querySelectorAll('.mw');
        if (words.length) {
            clearTimeout(litTimer);
            var n = 0;
            (function next() {
                if (n < words.length) { words[n++].classList.add('lit'); litTimer = setTimeout(next, 70); }
            })();
        }
    }

    function syncChrome() {
        dots.forEach(function (d, i) { d.classList.toggle('active', i === current); d.setAttribute('aria-current', i === current ? 'true' : 'false'); });
        if (header) header.classList.toggle('scrolled', current > 0);
        if (progress) progress.style.transform = 'scaleX(' + (current / (panels.length - 1)) + ')';
        var id = panels[current].id;
        history.replaceState(null, '', current ? '#' + id : location.pathname + location.search);
    }

    function goTo(i) {
        i = Math.max(0, Math.min(panels.length - 1, i));
        if (i === current || animating) return;
        var target = panels[i];
        if (target !== panels[0]) resetPanel(target);
        animating = true;
        current = i;
        place(true);
        syncChrome();
        /* contents fade in once the slide is well under way; the outgoing panel keeps its contents */
        setTimeout(function () { showPanel(target); }, DURATION * 0.45);
        setTimeout(function () { animating = false; }, DURATION + 80);
    }

    function canScrollInside(pnl, dir) {
        if (pnl.scrollHeight <= pnl.clientHeight + 2) return false;
        return dir > 0 ? pnl.scrollTop + pnl.clientHeight < pnl.scrollHeight - 2 : pnl.scrollTop > 2;
    }

    /* horizontal strips (highlights, mobile exhibitions) keep their own sideways scrolling */
    function inSideScroller(el) { return el && el.closest && el.closest('.hl-track, .ex-grid, .marquee'); }

    window.addEventListener('wheel', function (e) {
        if (Math.abs(e.deltaX) > Math.abs(e.deltaY) && inSideScroller(e.target)) return;
        var now = Date.now(), gap = now - lastWheel;
        lastWheel = now;
        var dir = e.deltaY > 0 ? 1 : e.deltaY < 0 ? -1 : 0;
        if (!dir) return;
        if (canScrollInside(panels[current], dir) && !animating) return;   /* let the panel scroll itself */
        e.preventDefault();
        /* one move per gesture: ignore the tail of a trackpad swipe */
        if (animating || gap < 160) return;
        goTo(current + dir);
    }, { passive: false });

    var touchY = null, touchX = null, touchAtEdge = { up: false, down: false };
    window.addEventListener('touchstart', function (e) {
        var t = e.touches[0];
        touchY = t.clientY; touchX = t.clientX;
        var pnl = panels[current];
        touchAtEdge.down = !canScrollInside(pnl, 1);
        touchAtEdge.up = !canScrollInside(pnl, -1);
    }, { passive: true });
    window.addEventListener('touchend', function (e) {
        if (touchY === null) return;
        var t = e.changedTouches[0];
        var dy = touchY - t.clientY, dx = touchX - t.clientX;
        touchY = null;
        if (Math.abs(dy) < 50 || Math.abs(dx) > Math.abs(dy)) return;
        if (dy > 0 && touchAtEdge.down) goTo(current + 1);
        if (dy < 0 && touchAtEdge.up) goTo(current - 1);
    }, { passive: true });

    document.addEventListener('keydown', function (e) {
        var tag = (e.target.tagName || '').toLowerCase();
        if (tag === 'input' || tag === 'textarea' || tag === 'select' || document.body.classList.contains('nav-open')) return;
        var pnl = panels[current], dir = 0;
        if (e.key === 'ArrowDown' || e.key === 'PageDown' || (e.key === ' ' && !e.shiftKey)) dir = 1;
        else if (e.key === 'ArrowUp' || e.key === 'PageUp' || (e.key === ' ' && e.shiftKey)) dir = -1;
        else if (e.key === 'Home') { e.preventDefault(); goTo(0); return; }
        else if (e.key === 'End') { e.preventDefault(); goTo(panels.length - 1); return; }
        if (!dir) return;
        if (canScrollInside(pnl, dir)) return;
        e.preventDefault();
        goTo(current + dir);
    });

    document.addEventListener('click', function (e) {
        var b = e.target.closest('[data-goto]');
        if (!b) return;
        e.preventDefault();
        goTo(+b.getAttribute('data-goto'));
    });

    /* keyboard users tabbing into another panel are taken to it */
    document.addEventListener('focusin', function (e) {
        var pnl = e.target.closest && e.target.closest('.panel');
        if (!pnl) return;
        var i = panels.indexOf(pnl);
        if (i !== current && i >= 0) {
            current = i; place(false); syncChrome(); showPanel(pnl);
        }
    });

    /* the browser's own jump-to-anchor scroll must never move the panel frame; only the slide does */
    var frameEl = document.getElementById('fp');
    function pin() { if (frameEl.scrollTop || frameEl.scrollLeft) { frameEl.scrollTop = 0; frameEl.scrollLeft = 0; } if (window.scrollY) window.scrollTo(0, 0); }
    frameEl.addEventListener('scroll', pin);
    window.addEventListener('scroll', pin);

    window.addEventListener('resize', function () { place(false); });
    window.addEventListener('hashchange', function () {
        var i = panels.map(function (pnl) { return pnl.id; }).indexOf(location.hash.slice(1));
        goTo(i < 0 ? 0 : i);
    });

    /* start on the panel named in the address, if any */
    var start = panels.map(function (pnl) { return pnl.id; }).indexOf(location.hash.slice(1));
    current = start > 0 ? start : 0;
    place(false);
    syncChrome();
    panels.forEach(function (pnl, i) { if (i !== current && i !== 0) resetPanel(pnl); });
    showPanel(panels[current]);
})();
