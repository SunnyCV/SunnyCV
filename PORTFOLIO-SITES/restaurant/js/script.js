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
