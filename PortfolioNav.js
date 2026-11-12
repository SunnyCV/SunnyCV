/* Shared top bar for the portfolio pages: a centred logo that glitches every
   ten seconds, and a small corner menu. Styled by PortfolioNav.css. */
(function () {
    if (document.getElementById('pfBar')) return;

    var PAGES = [
        ['Portfolio.html', 'Home'],
        ['Videos.html',    'Videos'],
        ['Designs.html',   'Designs'],
        ['Photos.html',    'Photos'],
        ['Music.html',     'Music'],
        ['Info.html',      'About']
    ];
    var here = (location.pathname.split('/').pop() || '').toLowerCase();

    /* light pages used the dark logo, so that tells us which colours to use */
    var oldLogo = document.querySelector('nav:not(.panel-nav) img, .mobile-header-logo');
    var light = !!oldLogo && !/inv/i.test(oldLogo.getAttribute('src') || '');

    var bar = document.createElement('div');
    bar.id = 'pfBar';
    if (light) bar.className = 'pf-light';

    var links = PAGES.map(function (p) {
        var active = p[0].toLowerCase() === here ? ' class="active" aria-current="page"' : '';
        return '<a href="' + p[0] + '" data-text="' + p[1] + '"' + active + '>' + p[1] + '</a>';
    }).join('');

    bar.innerHTML =
        '<button type="button" id="pfBurger" aria-label="Menu" aria-expanded="false" aria-controls="pfMenu">' +
            '<span></span><span></span><span></span></button>' +
        '<a id="pfLogo" href="Portfolio.html" aria-label="Charles Barrios, home">' +
            '<span class="lg lg-main"></span><span class="lg lg-red"></span><span class="lg lg-cyan"></span>' +
            '<span class="lg lg-slice"></span><span class="lg lg-slice"></span></a>' +
        '<div id="pfMenu" role="menu">' + links + '</div>';
    document.body.appendChild(bar);

    /* ── Menu box ── */
    var burger = bar.querySelector('#pfBurger');
    function setOpen(open) {
        bar.classList.toggle('open', open);
        burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    }
    burger.addEventListener('click', function (e) {
        e.stopPropagation();
        setOpen(!bar.classList.contains('open'));
    });
    document.addEventListener('click', function (e) {
        if (!e.target.closest || !e.target.closest('#pfMenu')) setOpen(false);
    });
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') setOpen(false);
    });

    /* ── Give the menu button a backing once the page scrolls under it ── */
    function onScroll(e) {
        var y = window.scrollY || 0;
        var t = e && e.target;
        var inner = (t && t !== document && t.nodeType === 1) ? t.scrollTop : 0;
        if (inner) y = Math.max(y, inner);
        bar.classList.toggle('pf-scrolled', y > 8);
        // pages that scroll an inner panel instead of the page (About): the logo leaves with the first panel
        if (t && t !== document && t.nodeType === 1 && t.scrollHeight > t.clientHeight + 40 && t.clientHeight > window.innerHeight * 0.6) {
            logoEl.style.marginTop = (-inner) + 'px';
        }
    }
    var logoEl = bar.querySelector('#pfLogo');
    window.addEventListener('scroll', onScroll, { passive: true });
    document.addEventListener('scroll', onScroll, { passive: true, capture: true });

    /* ── Logo: a quick glitch snap every ten seconds ── */
    var logo = bar.querySelector('#pfLogo');
    var red = logo.querySelector('.lg-red'), cyan = logo.querySelector('.lg-cyan');
    var slices = Array.prototype.slice.call(logo.querySelectorAll('.lg-slice'));
    var calm = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function snap(frames) {
        var n = 0;
        (function step() {
            if (n++ >= frames) {
                red.style.opacity = cyan.style.opacity = 0;
                slices.forEach(function (s) { s.style.opacity = 0; });
                logo.style.transform = '';
                return;
            }
            var w = logo.offsetWidth;
            var dx = (0.008 + Math.random() * 0.014) * w;
            red.style.opacity = cyan.style.opacity = 0.9;
            red.style.transform  = 'translateX(' + (-dx).toFixed(1) + 'px)';
            cyan.style.transform = 'translateX(' + dx.toFixed(1) + 'px)';
            slices.forEach(function (s) {
                var top = Math.random() * 75, hgt = 10 + Math.random() * 25;
                s.style.opacity = 1;
                s.style.clipPath = 'inset(' + top.toFixed(0) + '% 0 ' + Math.max(0, 100 - top - hgt).toFixed(0) + '% 0)';
                s.style.transform = 'translateX(' + ((Math.random() - 0.5) * 0.07 * w).toFixed(1) + 'px)';
            });
            // the whole logo jumps a pixel or two, then snaps back
            logo.style.transform = 'translate(calc(-50% + ' + ((Math.random() - 0.5) * 4).toFixed(1) + 'px), -50%)';
            setTimeout(step, 55);
        }());
    }
    if (!calm) setInterval(function () { if (!document.hidden) snap(4); }, 10000);
}());
