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

        if (quoteWords.length) {
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
})();
