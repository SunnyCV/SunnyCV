/* ── Mobile nav ── */
(function () {
    var btn  = document.getElementById('hamburger');
    var menu = document.getElementById('mobileMenu');
    if (!btn || !menu) return;
    btn.addEventListener('click', function () {
        var open = menu.classList.toggle('open');
        btn.classList.toggle('open', open);
    });
}());

/* `back` is the listings URL the property page's back arrow should return to. */
function propertyHref(id, back) {
    return 'property.html?id=' + encodeURIComponent(id) + (back ? '&back=' + encodeURIComponent(back) : '');
}

function cardHTML(l, back) {
    var badgeClass = l.status === 'New Listing' ? 'badge new' : 'badge';
    return '' +
        '<a class="card" data-pid="' + l.id + '" href="' + propertyHref(l.id, back) + '">' +
            '<div class="card-photo">' +
                photoHTML(l, 0) +
                '<span class="' + badgeClass + '">' + l.status + '</span>' +
                '<span class="card-type">' + l.type + '</span>' +
            '</div>' +
            '<div class="card-body">' +
                '<div class="card-price">' + formatPrice(l.price) + '</div>' +
                '<div class="card-title">' + l.title + '</div>' +
                '<div class="card-address">' + l.address + ', ' + l.city + '</div>' +
                '<div class="card-specs">' +
                    '<span><strong>' + l.beds + '</strong> bd</span>' +
                    '<span><strong>' + l.baths + '</strong> ba</span>' +
                    '<span><strong>' + l.sqft.toLocaleString('en-US') + '</strong> sqft</span>' +
                '</div>' +
            '</div>' +
        '</a>';
}

function fillCitySelect(select) {
    if (!select) return;
    var cities = [];
    LISTINGS.forEach(function (l) { if (cities.indexOf(l.city) === -1) cities.push(l.city); });
    cities.sort().forEach(function (c) {
        var opt = document.createElement('option');
        opt.value = c;
        opt.textContent = c;
        select.appendChild(opt);
    });
}

/* ── Home: search, crossfading backdrop, rotating reviews ── */
(function () {
    var backdrop = document.getElementById('backdrop');
    if (!backdrop) return;

    fillCitySelect(document.getElementById('heroCity'));

    var photos = (typeof HERO_PHOTOS !== 'undefined' && HERO_PHOTOS.length) ? HERO_PHOTOS : null;
    var slides = [];

    if (photos) {
        photos.forEach(function (src) {
            var s = document.createElement('div');
            s.className = 'bg-slide';
            s.style.backgroundImage = 'url("' + src + '")';
            backdrop.appendChild(s);
            slides.push(s);
        });
    } else {
        LISTINGS.filter(function (l) { return l.featured; }).slice(0, 4).forEach(function (l) {
            var s = document.createElement('div');
            s.className = 'bg-slide placeholder';
            s.innerHTML = sceneSVG(l.scene);
            backdrop.appendChild(s);
            slides.push(s);
        });
    }

    var cur = 0;
    slides[0].classList.add('active');
    if (slides.length > 1) {
        setInterval(function () {
            slides[cur].classList.remove('active');
            cur = (cur + 1) % slides.length;
            slides[cur].classList.add('active');
        }, 7000);
    }

    var reviews = document.querySelectorAll('.review');
    if (reviews.length > 1) {
        var r = 0;
        setInterval(function () {
            reviews[r].classList.remove('active');
            r = (r + 1) % reviews.length;
            reviews[r].classList.add('active');
        }, 5500);
    }
}());

/* ── Listings: search → immersive slideshow, or grid view ──
   The full state (search, view, current slide) lives in the URL so the
   property page's back arrow can return to exactly the same spot. */
(function () {
    var form = document.getElementById('searchForm');
    if (!form) return;

    function $(id) { return document.getElementById(id); }
    var city = $('sCity'), price = $('sPrice'), type = $('sType');
    var results = $('results'), countEl = $('resultCount');
    var showcase = $('showcase'), track = $('track'), dotsEl = $('ssDots'), ssCount = $('ssCount');
    var prevBtn = $('ssPrev'), nextBtn = $('ssNext');
    var gridView = $('gridView'), empty = $('noResults');
    var toggles = document.querySelectorAll('.view-toggle button');

    fillCitySelect(city);

    var state = { view: null, i: 0 };
    var list = [];
    var imgTimer = null;

    function currentURL() {
        var p = new URLSearchParams();
        if (city.value)  p.set('city', city.value);
        if (price.value) p.set('price', price.value);
        if (type.value)  p.set('type', type.value);
        if (state.view)  p.set('view', state.view);
        if (state.view === 'slides' && state.i) p.set('i', state.i);
        var qs = p.toString();
        return 'listings.html' + (qs ? '?' + qs : '');
    }
    function syncURL() { history.replaceState(null, '', currentURL()); }

    function filtered() {
        var max = parseInt(price.value, 10) || Infinity;
        return LISTINGS.filter(function (l) {
            return (!city.value || l.city === city.value) &&
                   (!type.value || l.type === type.value) &&
                   l.price <= max;
        });
    }

    function summary() {
        var bits = [];
        if (type.value)  bits.push(type.value + 's');
        if (city.value)  bits.push('in ' + city.value);
        if (price.value) bits.push('under ' + formatPrice(parseInt(price.value, 10)));
        return bits.length ? bits.join(' ') : 'All neighborhoods, all types';
    }

    function render() {
        list = filtered();
        document.body.classList.toggle('searched', !!state.view);
        results.hidden = !state.view;
        if (!state.view) { syncURL(); return; }

        countEl.innerHTML = list.length + (list.length === 1 ? ' home' : ' homes') + ' found<small>' + summary() + '</small>';
        toggles.forEach(function (b) { b.classList.toggle('active', b.dataset.view === state.view); });

        empty.hidden    = list.length > 0;
        showcase.hidden = state.view !== 'slides' || !list.length;
        gridView.hidden = state.view !== 'grid'   || !list.length;

        clearInterval(imgTimer);
        if (state.view === 'slides' && list.length) buildSlides();
        if (state.view === 'grid') gridView.innerHTML = list.map(function (l) { return cardHTML(l); }).join('');
        syncURL();
    }

    /* ── Slideshow ── */
    function slotHTML(l, idx) {
        var n = (l.photos && l.photos.length) || 4;
        var imgs = '';
        for (var k = 0; k < n; k++) {
            imgs += '<div class="slot-img' + (k === 0 ? ' active' : '') + '">' + photoHTML(l, k) + '</div>';
        }
        return '' +
            '<article class="slot" data-i="' + idx + '">' +
                '<div class="slot-bg">' + imgs + '</div>' +
                '<div class="slot-shade"></div>' +
                '<div class="slot-info">' +
                    '<span class="slot-tag' + (l.status === 'New Listing' ? ' new' : '') + '">' + l.status + ' &middot; ' + l.type + '</span>' +
                    '<h2>' + l.title + '</h2>' +
                    '<p class="slot-addr">' + l.address + ', ' + l.city + '</p>' +
                    '<div class="slot-price">' + formatPrice(l.price) + '</div>' +
                    '<div class="slot-specs">' +
                        '<span><strong>' + l.beds + '</strong> Beds</span>' +
                        '<span><strong>' + l.baths + '</strong> Baths</span>' +
                        '<span><strong>' + l.sqft.toLocaleString('en-US') + '</strong> sqft</span>' +
                    '</div>' +
                    '<p class="slot-desc">' + l.description + '</p>' +
                    '<a class="btn btn-sun" data-pid="' + l.id + '" href="' + propertyHref(l.id) + '">View Full Details &rarr;</a>' +
                '</div>' +
            '</article>';
    }

    function buildSlides() {
        track.innerHTML = list.map(slotHTML).join('');
        dotsEl.innerHTML = list.map(function (_, k) {
            return '<button type="button" aria-label="Go to property ' + (k + 1) + '" data-i="' + k + '"></button>';
        }).join('');
        var many = list.length > 1;
        prevBtn.hidden = nextBtn.hidden = dotsEl.hidden = !many;
        go(Math.min(state.i, list.length - 1), false);
    }

    function go(i, animate) {
        if (!list.length) return;
        state.i = (i + list.length) % list.length;
        track.style.transition = animate === false ? 'none' : '';
        track.style.transform = 'translateX(' + (-state.i * 100) + '%)';
        if (animate === false) { void track.offsetWidth; track.style.transition = ''; }

        track.querySelectorAll('.slot').forEach(function (s, k) { s.classList.toggle('current', k === state.i); });
        dotsEl.querySelectorAll('button').forEach(function (d, k) { d.classList.toggle('active', k === state.i); });
        ssCount.textContent = pad(state.i + 1) + ' / ' + pad(list.length);
        cycleImages();
        syncURL();
    }
    function pad(n) { return n < 10 ? '0' + n : '' + n; }

    function cycleImages() {
        clearInterval(imgTimer);
        var slot = track.querySelector('.slot.current');
        if (!slot) return;
        var imgs = slot.querySelectorAll('.slot-img');
        if (imgs.length < 2) return;
        var k = 0;
        imgs.forEach(function (im, j) { im.classList.toggle('active', j === 0); });
        imgTimer = setInterval(function () {
            imgs[k].classList.remove('active');
            k = (k + 1) % imgs.length;
            imgs[k].classList.add('active');
        }, 3800);
    }

    prevBtn.addEventListener('click', function () { go(state.i - 1); });
    nextBtn.addEventListener('click', function () { go(state.i + 1); });
    dotsEl.addEventListener('click', function (e) {
        var d = e.target.closest('button');
        if (d) go(parseInt(d.dataset.i, 10));
    });
    document.addEventListener('keydown', function (e) {
        if (state.view !== 'slides' || list.length < 2) return;
        if (/^(SELECT|INPUT|TEXTAREA)$/.test(document.activeElement.tagName)) return;
        if (e.key === 'ArrowLeft')  go(state.i - 1);
        if (e.key === 'ArrowRight') go(state.i + 1);
    });

    /* Swipe / drag between properties */
    var startX = null, dx = 0, dragged = false;
    track.addEventListener('pointerdown', function (e) {
        if (list.length < 2 || e.target.closest('a, button')) return;
        startX = e.clientX; dx = 0; dragged = false;
        track.style.transition = 'none';
        track.classList.add('dragging');
        track.setPointerCapture(e.pointerId);
    });
    track.addEventListener('pointermove', function (e) {
        if (startX === null) return;
        dx = e.clientX - startX;
        if (Math.abs(dx) > 5) dragged = true;
        track.style.transform = 'translateX(calc(' + (-state.i * 100) + '% + ' + dx + 'px))';
    });
    function endDrag() {
        if (startX === null) return;
        startX = null;
        track.style.transition = '';
        track.classList.remove('dragging');
        var threshold = Math.min(80, showcase.offsetWidth * 0.15);
        if (dx < -threshold) go(state.i + 1);
        else if (dx > threshold) go(state.i - 1);
        else go(state.i);
    }
    track.addEventListener('pointerup', endDrag);
    track.addEventListener('pointercancel', endDrag);
    track.addEventListener('click', function (e) { if (dragged) { e.preventDefault(); dragged = false; } }, true);

    /* Point "View Full Details" / grid cards at the current state, so the
       property page's back arrow returns right here. */
    results.addEventListener('click', function (e) {
        var a = e.target.closest('a[data-pid]');
        if (a) a.href = propertyHref(a.dataset.pid, currentURL());
    });

    /* ── Controls ── */
    form.addEventListener('submit', function (e) {
        e.preventDefault();
        if (!state.view) state.view = 'slides';
        state.i = 0;
        render();
        results.scrollIntoView({ behavior: 'smooth' });
    });
    $('viewAll').addEventListener('click', function () {
        city.value = ''; price.value = ''; type.value = '';
        state.view = 'grid';
        state.i = 0;
        render();
        results.scrollIntoView({ behavior: 'smooth' });
    });
    toggles.forEach(function (b) {
        b.addEventListener('click', function () {
            if (state.view === b.dataset.view) return;
            state.view = b.dataset.view;
            render();
        });
    });

    /* ── Restore state from the URL (incoming search or back navigation) ── */
    var params = new URLSearchParams(window.location.search);
    city.value  = params.get('city')  || '';
    price.value = params.get('price') || '';
    type.value  = params.get('type')  || '';
    var v = params.get('view');
    if (v === 'slides' || v === 'grid') state.view = v;
    else if (city.value || price.value || type.value) state.view = 'slides';
    state.i = parseInt(params.get('i'), 10) || 0;
    render();
}());

/* ── Property detail ── */
(function () {
    var root = document.getElementById('propertyRoot');
    if (!root) return;

    var params = new URLSearchParams(window.location.search);
    var l = findListing(params.get('id')) || LISTINGS[0];

    /* Back arrow: return to the exact listings view the visitor came from. */
    var back = params.get('back');
    if (!back || back.indexOf('listings.html') !== 0) back = null;
    var backLink = document.getElementById('backLink');
    if (back) backLink.href = back;
    backLink.addEventListener('click', function (e) {
        if (document.referrer && document.referrer.indexOf('listings.html') !== -1 && history.length > 1) {
            e.preventDefault();
            history.back();
        }
    });

    document.title = l.title + ' — [Agency Name]';

    var main   = document.getElementById('galleryMain');
    var thumbs = document.getElementById('galleryThumbs');
    main.innerHTML = photoHTML(l, 0);

    var thumbCount = (l.photos && l.photos.length) || 4;
    var thumbHTML = '';
    for (var i = 0; i < thumbCount; i++) {
        thumbHTML += '<button type="button" class="thumb' + (i === 0 ? ' active' : '') + '" data-i="' + i + '">' + photoHTML(l, i) + '</button>';
    }
    thumbs.innerHTML = thumbHTML;
    thumbs.addEventListener('click', function (e) {
        var t = e.target.closest('.thumb');
        if (!t) return;
        thumbs.querySelectorAll('.thumb').forEach(function (b) { b.classList.remove('active'); });
        t.classList.add('active');
        main.innerHTML = photoHTML(l, parseInt(t.dataset.i, 10));
    });

    document.getElementById('pStatus').textContent  = l.status;
    document.getElementById('pTitle').textContent   = l.title;
    document.getElementById('pAddress').textContent = l.address + ', ' + l.city;
    document.getElementById('pPrice').textContent   = formatPrice(l.price);
    document.getElementById('pBeds').textContent    = l.beds;
    document.getElementById('pBaths').textContent   = l.baths;
    document.getElementById('pSqft').textContent    = l.sqft.toLocaleString('en-US');
    document.getElementById('pType').textContent    = l.type;
    document.getElementById('pDesc').textContent    = l.description;
    document.getElementById('pFeatures').innerHTML  = l.features.map(function (f) { return '<li>' + f + '</li>'; }).join('');
    document.getElementById('inquiryMsg').value     = 'Hi, I’m interested in ' + l.address + ' and would like to schedule a viewing.';

    var similar = LISTINGS.filter(function (x) { return x.id !== l.id && (x.city === l.city || x.type === l.type); }).slice(0, 3);
    document.getElementById('similarGrid').innerHTML = similar.map(function (x) { return cardHTML(x, back); }).join('');
}());

/* ── Forms (front-end only — no backend wired up yet) ── */
document.querySelectorAll('form[data-success]').forEach(function (form) {
    form.addEventListener('submit', function (e) {
        e.preventDefault();
        var success = document.getElementById(form.dataset.success);
        form.style.display = 'none';
        if (success) success.classList.add('visible');
    });
});
