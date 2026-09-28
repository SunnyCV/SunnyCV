/* ── Mobile nav ── */
(function () {
    var btn  = document.getElementById('hamburger');
    var menu = document.getElementById('mobileMenu');
    if (!btn || !menu) return;
    btn.addEventListener('click', function () {
        var open = menu.classList.toggle('open');
        btn.classList.toggle('open', open);
        document.body.style.overflow = open ? 'hidden' : '';
    });
    menu.querySelectorAll('a').forEach(function (a) {
        a.addEventListener('click', function () {
            menu.classList.remove('open');
            btn.classList.remove('open');
            document.body.style.overflow = '';
        });
    });
}());

/* ── Nav goes solid after scrolling past the hero ── */
(function () {
    var nav = document.querySelector('header.site-nav');
    if (!nav) return;
    function update() {
        nav.classList.toggle('solid', window.scrollY > 60);
    }
    window.addEventListener('scroll', update);
    update();
}());

/* ── Fade-in on scroll ── */
(function () {
    var items = document.querySelectorAll('.reveal');
    if (!items.length) return;
    if (!('IntersectionObserver' in window)) {
        items.forEach(function (el) { el.classList.add('in'); });
        return;
    }
    var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (entry.isIntersecting) {
                entry.target.classList.add('in');
                io.unobserve(entry.target);
            }
        });
    }, { threshold: 0.15 });
    items.forEach(function (el) { io.observe(el); });
}());

/* ── Home page: sliding critic reviews ── */
(function () {
    var slides = document.querySelectorAll('.review-slide');
    if (slides.length < 2) return;
    var i = 0;
    setInterval(function () {
        slides[i].classList.remove('active');
        i = (i + 1) % slides.length;
        slides[i].classList.add('active');
    }, 5500);
}());

/* ── Menu page: category tabs with a quick fade-out / fade-in swap ── */
(function () {
    var tabsWrap = document.getElementById('menuTabs');
    var titleEl  = document.getElementById('menuBoxTitle');
    if (!tabsWrap || !titleEl) return;

    var tabs   = tabsWrap.querySelectorAll('.menu-tab');
    var panels = document.querySelectorAll('.menu-panel');
    var switching = false;

    function labelFor(tab) { return tab.textContent.trim(); }

    tabsWrap.addEventListener('click', function (e) {
        var tab = e.target.closest('.menu-tab');
        if (!tab || tab.classList.contains('active') || switching) return;
        switching = true;

        var cat = tab.dataset.cat;
        var currentPanel = document.querySelector('.menu-panel.active');
        var nextPanel = document.querySelector('.menu-panel[data-panel="' + cat + '"]');
        if (!nextPanel || nextPanel === currentPanel) { switching = false; return; }

        tabs.forEach(function (t) { t.classList.remove('active'); });
        tab.classList.add('active');

        if (currentPanel) currentPanel.classList.remove('visible');

        setTimeout(function () {
            if (currentPanel) currentPanel.classList.remove('active');
            nextPanel.classList.add('active');
            titleEl.textContent = labelFor(tab);
            // force reflow so the opacity transition actually fires
            void nextPanel.offsetWidth;
            requestAnimationFrame(function () {
                nextPanel.classList.add('visible');
                switching = false;
            });
        }, 260);
    });
}());

/* ── Reservation form (front-end only — no backend wired up yet) ── */
(function () {
    var form = document.getElementById('reservationForm');
    if (!form) return;
    var confirmEl = document.getElementById('reservationConfirm');

    form.addEventListener('submit', function (e) {
        e.preventDefault();
        form.style.display = 'none';
        if (confirmEl) confirmEl.classList.add('visible');
    });
}());
