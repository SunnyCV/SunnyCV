/* ══════════════════════════════════════
   ASHWOOD — site behaviour
   Shared header/footer, then one block per page (each guarded by an element id).
══════════════════════════════════════ */

var NAV = [
    ['exhibitions', 'Exhibitions', 'exhibitions.html'],
    ['collection',  'Collection',  'collection.html'],
    ['visit',       'Visit',       'visit.html'],
    ['events',      'Events',      'events.html'],
    ['membership',  'Membership',  'membership.html'],
    ['about',       'About',       'about.html']
];

function $(id) { return document.getElementById(id); }
function qs(name) { return new URLSearchParams(location.search).get(name); }
function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; });
}

/* ── Header & footer ── */
(function () {
    var page = document.body.getAttribute('data-page') || '';
    var hero = document.body.hasAttribute('data-hero');
    var today = new Date().getDay();

    var links = NAV.map(function (n) {
        return '<a href="' + n[2] + '"' + (n[0] === page ? ' class="active"' : '') + '>' + n[1] + '</a>';
    }).join('');
    var mlinks = NAV.map(function (n) {
        return '<a class="m-link' + (n[0] === page ? ' active' : '') + '" href="' + n[2] + '">' + n[1] + '</a>';
    }).join('');

    var logo = '<a href="index.html" class="logo" aria-label="Ashwood Museum home"><span class="logo-mark">' + ICON.mark + '</span>' +
        '<span class="logo-text"><span class="logo-name">Ashwood</span><span class="logo-sub">Museum of Art &amp; History</span></span></a>';

    var header = $('siteHeader');
    if (header) {
        header.className = 'site-header' + (hero ? ' over-hero' : '');
        header.innerHTML = '<div class="header-inner">' + logo +
            '<nav class="main-nav" aria-label="Main">' + links + '</nav>' +
            '<a href="tickets.html" class="btn btn-gold btn-small header-cta">Tickets</a>' +
            '<button type="button" class="nav-toggle" id="navToggle" aria-label="Open menu" aria-expanded="false"><span></span></button>' +
            '</div>';
        var mnav = document.createElement('nav');
        mnav.className = 'mobile-nav';
        mnav.id = 'mobileNav';
        mnav.setAttribute('aria-label', 'Mobile');
        mnav.innerHTML = '<a class="m-link' + (page === 'home' ? ' active' : '') + '" href="index.html">Home</a>' + mlinks +
            '<a href="tickets.html" class="btn btn-gold">Buy Tickets</a>' +
            '<p class="m-hours">Today: ' + hoursLabel(today) + '</p>';
        header.parentNode.insertBefore(mnav, header.nextSibling);

        var toggle = $('navToggle');
        toggle.addEventListener('click', function () {
            var open = document.body.classList.toggle('nav-open');
            toggle.setAttribute('aria-expanded', open);
            toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
        });
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && document.body.classList.contains('nav-open')) toggle.click();
        });

        var onScroll = function () { header.classList.toggle('scrolled', window.scrollY > 40); };
        window.addEventListener('scroll', onScroll, { passive: true });
        onScroll();
    }

    var footer = $('siteFooter');
    if (footer) {
        footer.classList.add('site-footer');
        footer.innerHTML = treelineSVG() +
            '<div class="container"><div class="footer-grid">' +
                '<div>' + logo + '<p class="footer-address">' + MUSEUM.street + '<br>' + MUSEUM.city + '<br>Beside Ashwood Forest</p></div>' +
                '<div><h4>Visit</h4><ul><li><a href="visit.html">Plan Your Visit</a></li><li><a href="tickets.html">Tickets</a></li><li><a href="visit.html#hours">Hours</a></li><li><a href="visit.html#accessibility">Accessibility</a></li></ul></div>' +
                '<div><h4>Explore</h4><ul><li><a href="exhibitions.html">Exhibitions</a></li><li><a href="collection.html">The Collection</a></li><li><a href="events.html">Events</a></li><li><a href="visit.html#floors">Floor Guide</a></li></ul></div>' +
                '<div><h4>Support</h4><ul><li><a href="membership.html">Membership</a></li><li><a href="about.html">About Ashwood</a></li><li><a href="about.html#contact">Contact</a></li></ul></div>' +
                '<div class="footer-news"><h4>Stay in Touch</h4><p>Exhibition news, events and stories from the collection, once a month.</p>' +
                    '<form class="news-form" id="newsForm" novalidate><input type="email" placeholder="Your email" aria-label="Email address" required><button type="submit">Sign Up</button></form>' +
                    '<p class="news-thanks" id="newsThanks">Thank you, you’re on the list.</p></div>' +
            '</div>' +
            '<div class="footer-bottom"><span>&copy; 2026 Ashwood Museum of Art &amp; History. All rights reserved.</span><span>' + MUSEUM.phone + ' &nbsp;·&nbsp; ' + MUSEUM.email + '</span></div></div>';

        $('newsForm').addEventListener('submit', function (e) {
            e.preventDefault();
            var input = this.querySelector('input');
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value.trim())) { input.focus(); input.setCustomValidity('Please enter a valid email'); input.reportValidity(); return; }
            input.setCustomValidity('');
            this.style.display = 'none';
            $('newsThanks').classList.add('show');
        });
    }

    document.querySelectorAll('[data-ornament]').forEach(function (el) {
        el.classList.add('ornament');
        el.innerHTML = ICON.laurel;
    });
    document.querySelectorAll('[data-treeline]').forEach(function (el) {
        el.outerHTML = treelineSVG();
    });
})();

/* ── Shared card templates ── */
function locHTML(text) { return '<span class="loc">' + ICON.pin + esc(text) + '</span>'; }

function artCardHTML(o) {
    var who = o.artist || o.culture;
    return '<a class="art-card" href="artwork.html?id=' + o.id + '">' +
        '<div class="art-media">' + artHTML(o) + '</div>' +
        '<h3>' + esc(o.title) + '</h3>' +
        '<p class="meta">' + esc(who) + '<br>' + esc(o.date) + '</p>' +
        locHTML(locationLabel(o)) +
        '</a>';
}

function exCardHTML(ex, withStatus) {
    var art = findArt(ex.cover);
    var st = exStatus(ex);
    var pill = '';
    if (withStatus && st === 'upcoming') pill = '<span class="status-pill">Opens ' + fmtDate(parseDate(ex.start), false) + '</span>';
    if (withStatus && st === 'past') pill = '<span class="status-pill">Closed</span>';
    return '<a class="ex-card" href="exhibition.html?id=' + ex.id + '">' +
        '<div class="art-media arch cover">' + pill + artHTML(art) + '</div>' +
        '<span class="eyebrow dates">' + fmtRange(ex.start, ex.end) + '</span>' +
        '<h3>' + esc(ex.title) + '</h3>' +
        '<p>' + esc(ex.subtitle) + '</p>' +
        locHTML(ex.galleries + ' · Floor ' + WINGS[ex.wing].floor) +
        '</a>';
}

function upcomingEvents(n) {
    var t = todayDate();
    return EVENTS.filter(function (e) { return parseDate(e.date) >= t; })
        .sort(function (a, b) { return parseDate(a.date) - parseDate(b.date); })
        .slice(0, n);
}

function eventDateBlock(e) {
    var d = parseDate(e.date);
    return '<div class="ev-date"><span>' + MON[d.getMonth()] + '</span><strong>' + d.getDate() + '</strong><span>' + DAYS[d.getDay()].slice(0, 3) + '</span></div>';
}

/* ══════════════════════════════════════
   HOME
══════════════════════════════════════ */
(function () {
    if (!$('heroArt')) return;
    $('heroArt').innerHTML = facadeSVG();

    var d = new Date().getDay();
    var open = HOURS[d].open;
    var next = (d + 1) % 7;
    while (!HOURS[next].open) next = (next + 1) % 7;
    $('todayHours').innerHTML = open
        ? 'Open today <strong>' + hoursLabel(d) + '</strong>'
        : 'Closed today · Open ' + DAYS[next] + ' <strong>' + hoursLabel(next) + '</strong>';

    var current = EXHIBITIONS.filter(function (e) { return exStatus(e) === 'current'; }).slice(0, 3);
    if (current.length < 3) {
        current = current.concat(EXHIBITIONS.filter(function (e) { return exStatus(e) === 'upcoming'; })).slice(0, 3);
    }
    $('homeExhibitions').innerHTML = current.map(function (e) { return exCardHTML(e, true); }).join('');

    var picks = ['cypresses-above-the-bay', 'close-helmet', 'medallion-carpet', 'marble-head-of-a-youth', 'funerary-mask-of-a-noble', 'lancet-window-tree-of-life', 'vase-with-peony-scrolls', 'young-man-in-a-red-doublet'];
    $('homeHighlights').innerHTML = picks.map(function (id) { return artCardHTML(findArt(id)); }).join('');

    var track = $('homeHighlights');
    document.querySelectorAll('[data-scroll]').forEach(function (b) {
        b.addEventListener('click', function () {
            var card = track.querySelector('.art-card');
            var step = card ? card.getBoundingClientRect().width + 30 : 300;
            track.scrollBy({ left: step * (+b.getAttribute('data-scroll')), behavior: 'smooth' });
        });
    });

    $('homeEvents').innerHTML = upcomingEvents(3).map(function (e) {
        return '<a class="ev-row" href="events.html#' + e.id + '">' + eventDateBlock(e) +
            '<div class="ev-body"><span class="eyebrow">' + e.type + '</span><h3>' + esc(e.title) + '</h3><p>' + e.time + ' · ' + esc(e.place) + '</p></div>' +
            '<span class="ev-arrow">&rarr;</span></a>';
    }).join('');
})();

/* ══════════════════════════════════════
   EXHIBITIONS LIST
══════════════════════════════════════ */
(function () {
    var list = $('exList');
    if (!list) return;
    var tabs = document.querySelectorAll('.ex-tab');
    var show = qs('show');
    if (['current', 'upcoming', 'past'].indexOf(show) < 0) show = 'current';

    function render() {
        tabs.forEach(function (t) {
            var on = t.getAttribute('data-show') === show;
            t.classList.toggle('active', on);
            t.setAttribute('aria-selected', on);
        });
        var items = EXHIBITIONS.filter(function (e) { return exStatus(e) === show; })
            .sort(function (a, b) { return show === 'past' ? parseDate(b.end) - parseDate(a.end) : parseDate(a.start) - parseDate(b.start); });
        if (!items.length) {
            list.innerHTML = '<p class="ex-empty">There are no ' + show + ' exhibitions to show right now.</p>';
            return;
        }
        list.innerHTML = items.map(function (ex, i) {
            var art = findArt(ex.cover);
            var label = show === 'current' ? 'Through ' + fmtDate(parseDate(ex.end)) : show === 'upcoming' ? 'Opens ' + fmtDate(parseDate(ex.start)) : 'Closed ' + fmtDate(parseDate(ex.end));
            return '<article class="ex-feature' + (i % 2 ? ' flip' : '') + ' reveal in">' +
                '<a class="art-media arch cover" href="exhibition.html?id=' + ex.id + '">' + artHTML(art) + '</a>' +
                '<div class="ex-feature-text">' +
                    '<span class="eyebrow">' + label + '</span>' +
                    '<h2><a href="exhibition.html?id=' + ex.id + '">' + esc(ex.title) + '</a></h2>' +
                    '<p class="ex-sub">' + esc(ex.subtitle) + '</p>' +
                    '<p>' + esc(ex.summary) + '</p>' +
                    '<p class="ex-dates">' + fmtRange(ex.start, ex.end) + '</p>' +
                    locHTML(ex.galleries + ' · ' + WINGS[ex.wing].name + ' · Floor ' + WINGS[ex.wing].floor) +
                    '<div class="ex-actions"><a class="btn btn-forest" href="exhibition.html?id=' + ex.id + '">Explore the Exhibition</a></div>' +
                '</div></article>';
        }).join('');
    }

    tabs.forEach(function (t) {
        t.addEventListener('click', function () {
            show = t.getAttribute('data-show');
            history.replaceState(null, '', 'exhibitions.html' + (show === 'current' ? '' : '?show=' + show));
            render();
        });
    });
    render();
})();

/* ══════════════════════════════════════
   SINGLE EXHIBITION
══════════════════════════════════════ */
(function () {
    var root = $('exRoot');
    if (!root) return;
    var ex = findExhibition(qs('id')) || EXHIBITIONS[0];
    var st = exStatus(ex);
    var art = findArt(ex.cover);
    var wing = WINGS[ex.wing];
    document.title = ex.title + ' — Ashwood Museum';

    $('exHeroArt').innerHTML = artHTML(art);
    $('exStatus').textContent = st === 'current' ? 'Now on view' : st === 'upcoming' ? 'Coming soon' : 'Past exhibition';
    $('exTitle').textContent = ex.title;
    $('exSubtitle').textContent = ex.subtitle;
    $('exDates').textContent = fmtRange(ex.start, ex.end);
    $('exWhere').textContent = ex.galleries + ' · ' + wing.name + ' · Floor ' + wing.floor;
    $('exBody').innerHTML = ex.body.map(function (p) { return '<p>' + esc(p) + '</p>'; }).join('');
    $('exMap').innerHTML = floorMapSVG(wing.floor, ex.wing);
    $('exMapLabel').textContent = wing.name + ', Floor ' + wing.floor;

    var cta = $('exCta');
    if (st === 'past') {
        cta.innerHTML = '<p>This exhibition has closed. Many of its works are on view in the permanent collection.</p><a class="btn btn-forest" href="exhibitions.html">See Current Exhibitions</a>';
    } else {
        cta.innerHTML = '<p>' + (st === 'current' ? 'Included with general admission. Free for members.' : 'Opens ' + fmtDate(parseDate(ex.start)) + '. Included with general admission.') + '</p>' +
            '<a class="btn btn-gold" href="tickets.html">Get Tickets</a><a class="btn btn-line" href="membership.html">Become a Member</a>';
    }

    var works = COLLECTION.filter(function (o) { return o.exhibition === ex.id; });
    if (works.length) {
        $('exWorks').innerHTML = works.map(artCardHTML).join('');
    } else {
        $('exWorksSection').hidden = true;
    }

    var others = EXHIBITIONS.filter(function (e) { return e.id !== ex.id && exStatus(e) !== 'past'; }).slice(0, 3);
    $('exOthers').innerHTML = others.map(function (e) { return exCardHTML(e, true); }).join('');
})();

/* ══════════════════════════════════════
   COLLECTION (browse + filters)
══════════════════════════════════════ */
(function () {
    var grid = $('colGrid');
    if (!grid) return;
    var PAGE = 12;
    var state = { q: '', era: '', culture: '', type: '', wing: '', sort: 'featured', shown: PAGE };

    function fill(sel, items, all) {
        sel.innerHTML = '<option value="">' + all + '</option>' + items.map(function (v) {
            return '<option value="' + esc(v[0]) + '">' + esc(v[1]) + '</option>';
        }).join('');
    }
    fill($('fEra'), ERAS.map(function (v) { return [v, v]; }), 'All eras');
    fill($('fCulture'), CULTURES.map(function (v) { return [v, v]; }), 'All cultures');
    fill($('fType'), TYPES.map(function (v) { return [v, v]; }), 'All object types');
    fill($('fWing'), Object.keys(WINGS).filter(function (k) { return k !== 'greathall' && k !== 'shop'; }).map(function (k) { return [k, WINGS[k].name]; }), 'All galleries');

    function fromURL() {
        var p = new URLSearchParams(location.search);
        state.q = p.get('q') || '';
        state.era = ERAS.indexOf(p.get('era')) >= 0 ? p.get('era') : '';
        state.culture = CULTURES.indexOf(p.get('culture')) >= 0 ? p.get('culture') : '';
        state.type = TYPES.indexOf(p.get('type')) >= 0 ? p.get('type') : '';
        state.wing = WINGS[p.get('wing')] ? p.get('wing') : '';
        state.sort = ['featured', 'title', 'oldest', 'newest'].indexOf(p.get('sort')) >= 0 ? p.get('sort') : 'featured';
        state.shown = PAGE;
        $('fSearch').value = state.q;
        $('fEra').value = state.era;
        $('fCulture').value = state.culture;
        $('fType').value = state.type;
        $('fWing').value = state.wing;
        $('fSort').value = state.sort;
    }
    function toURL() {
        var p = new URLSearchParams();
        ['q', 'era', 'culture', 'type', 'wing'].forEach(function (k) { if (state[k]) p.set(k, state[k]); });
        if (state.sort !== 'featured') p.set('sort', state.sort);
        var s = p.toString();
        history.replaceState(null, '', 'collection.html' + (s ? '?' + s : ''));
    }

    /* rough sortable year: B.C. dates become negative */
    function year(o) {
        var m = o.date.match(/(\d{3,4})/);
        if (!m) {
            var c = o.date.match(/(\d{1,2})(st|nd|rd|th)\s+century/i);
            var y = c ? (+c[1] - 1) * 100 + 50 : 0;
            return /B\.C\./.test(o.date) ? -y : y;
        }
        return /B\.C\./.test(o.date) ? -(+m[1]) : +m[1];
    }

    function results() {
        var q = state.q.trim().toLowerCase();
        var list = COLLECTION.filter(function (o) {
            if (state.era && o.era !== state.era) return false;
            if (state.culture && o.culture !== state.culture) return false;
            if (state.type && o.type !== state.type) return false;
            if (state.wing && o.wing !== state.wing) return false;
            if (q) {
                var hay = [o.title, o.artist, o.artistBio, o.culture, o.type, o.medium, o.date, WINGS[o.wing].name, 'gallery ' + o.gallery].join(' ').toLowerCase();
                return q.split(/\s+/).every(function (w) { return hay.indexOf(w) >= 0; });
            }
            return true;
        });
        if (state.sort === 'title') list.sort(function (a, b) { return a.title.localeCompare(b.title); });
        if (state.sort === 'oldest') list.sort(function (a, b) { return year(a) - year(b); });
        if (state.sort === 'newest') list.sort(function (a, b) { return year(b) - year(a); });
        return list;
    }

    function chips() {
        var out = [];
        if (state.q) out.push(['q', '“' + state.q + '”']);
        if (state.era) out.push(['era', state.era]);
        if (state.culture) out.push(['culture', state.culture]);
        if (state.type) out.push(['type', state.type]);
        if (state.wing) out.push(['wing', WINGS[state.wing].name]);
        $('colChips').innerHTML = out.map(function (c) {
            return '<button type="button" class="chip" data-clear="' + c[0] + '">' + esc(c[1]) + ' <span aria-hidden="true">&times;</span><span class="sr">Remove filter</span></button>';
        }).join('') + (out.length > 1 ? '<button type="button" class="chip-clear" data-clear="all">Clear all</button>' : '');
    }

    function render() {
        var list = results();
        $('colCount').innerHTML = '<strong>' + list.length + '</strong> ' + (list.length === 1 ? 'work' : 'works');
        chips();
        if (!list.length) {
            grid.innerHTML = '';
            $('colEmpty').hidden = false;
            $('colMore').hidden = true;
            return;
        }
        $('colEmpty').hidden = true;
        grid.innerHTML = list.slice(0, state.shown).map(artCardHTML).join('');
        $('colMore').hidden = list.length <= state.shown;
    }

    function update() { state.shown = PAGE; toURL(); render(); }

    var t;
    $('fSearch').addEventListener('input', function () {
        clearTimeout(t);
        var v = this.value;
        t = setTimeout(function () { state.q = v; update(); }, 220);
    });
    $('colSearchForm').addEventListener('submit', function (e) {
        e.preventDefault();
        clearTimeout(t);
        state.q = $('fSearch').value;
        update();
        $('colResults').scrollIntoView({ behavior: 'smooth' });
    });
    [['fEra', 'era'], ['fCulture', 'culture'], ['fType', 'type'], ['fWing', 'wing'], ['fSort', 'sort']].forEach(function (p) {
        $(p[0]).addEventListener('change', function () { state[p[1]] = this.value; update(); });
    });
    document.addEventListener('click', function (e) {
        var c = e.target.closest('[data-clear]');
        if (!c) return;
        var k = c.getAttribute('data-clear');
        if (k === 'all') { state.q = state.era = state.culture = state.type = state.wing = ''; }
        else state[k] = '';
        $('fSearch').value = state.q;
        $('fEra').value = state.era; $('fCulture').value = state.culture; $('fType').value = state.type; $('fWing').value = state.wing;
        update();
    });
    $('colMore').addEventListener('click', function () { state.shown += PAGE; render(); });

    document.querySelectorAll('[data-type-link]').forEach(function (a) {
        a.addEventListener('click', function (e) {
            e.preventDefault();
            state.q = state.era = state.culture = state.wing = '';
            state.type = a.getAttribute('data-type-link');
            $('fSearch').value = ''; $('fEra').value = ''; $('fCulture').value = ''; $('fWing').value = '';
            $('fType').value = state.type;
            update();
            $('colResults').scrollIntoView({ behavior: 'smooth' });
        });
    });

    fromURL();
    render();
    window.addEventListener('popstate', function () { fromURL(); render(); });
})();

/* ══════════════════════════════════════
   SINGLE ARTWORK
══════════════════════════════════════ */
(function () {
    var root = $('artRoot');
    if (!root) return;
    var o = findArt(qs('id')) || COLLECTION[0];
    var wing = WINGS[o.wing];
    document.title = o.title + ' — Ashwood Museum';

    $('artMedia').innerHTML = artHTML(o);
    $('artCulture').textContent = o.culture + ' · ' + o.type;
    $('artTitle').textContent = o.title;
    $('artWho').innerHTML = o.artist ? '<strong>' + esc(o.artist) + '</strong>' + (o.artistBio ? ' <span>(' + esc(o.artistBio) + ')</span>' : '') : (o.artistBio ? '<strong>' + esc(o.artistBio) + '</strong>' : '');
    $('artDate').textContent = o.date;
    $('artDesc').textContent = o.description;

    $('artGallery').textContent = 'Gallery ' + o.gallery;
    $('artWing').textContent = wing.name + ' · Floor ' + wing.floor;
    $('artMap').innerHTML = floorMapSVG(wing.floor, o.wing);
    $('artMapLink').href = 'collection.html?wing=' + o.wing;
    $('artMapLink').textContent = 'More in ' + wing.name;

    var rows = [
        ['Title', o.title],
        ['Artist', o.artist ? o.artist + (o.artistBio ? ' (' + o.artistBio + ')' : '') : ''],
        ['Culture', o.artist ? o.culture : (o.artistBio || o.culture)],
        ['Date', o.date],
        ['Medium', o.medium],
        ['Dimensions', o.dimensions],
        ['Classification', o.type],
        ['Period', o.era],
        ['Credit Line', o.credit],
        ['Object Number', o.accession]
    ].filter(function (r) { return r[1]; });
    $('artDetails').innerHTML = rows.map(function (r) { return '<dt>' + r[0] + '</dt><dd>' + esc(r[1]) + '</dd>'; }).join('');

    if (o.exhibition) {
        var ex = findExhibition(o.exhibition);
        var st = exStatus(ex);
        $('artExhibition').hidden = false;
        $('artExhibition').innerHTML = '<span class="eyebrow">' + (st === 'current' ? 'Featured in' : st === 'upcoming' ? 'Coming soon in' : 'Previously in') + '</span>' +
            '<a href="exhibition.html?id=' + ex.id + '"><strong>' + esc(ex.title) + '</strong> &rarr;</a><span>' + fmtRange(ex.start, ex.end) + '</span>';
    }

    var related = COLLECTION.filter(function (x) { return x.id !== o.id && x.wing === o.wing; });
    var more = COLLECTION.filter(function (x) { return x.id !== o.id && x.wing !== o.wing && (x.type === o.type || x.culture === o.culture); });
    $('artRelated').innerHTML = related.concat(more).slice(0, 4).map(artCardHTML).join('');

    var back = $('artBack');
    if (document.referrer && document.referrer.indexOf('collection.html') >= 0 && history.length > 1) {
        back.addEventListener('click', function (e) { e.preventDefault(); history.back(); });
    }

    /* full-screen viewer */
    var box = $('lightbox');
    function openBox() {
        $('lightboxArt').innerHTML = artHTML(o);
        $('lightboxCap').textContent = o.title + (o.artist ? ', ' + o.artist : '') + ', ' + o.date;
        box.hidden = false;
        document.body.style.overflow = 'hidden';
        $('lightboxClose').focus();
    }
    function closeBox() {
        box.hidden = true;
        document.body.style.overflow = '';
        $('artZoom').focus();
    }
    $('artZoom').addEventListener('click', openBox);
    $('artMedia').addEventListener('click', openBox);
    $('lightboxClose').addEventListener('click', closeBox);
    box.addEventListener('click', function (e) { if (e.target === box) closeBox(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !box.hidden) closeBox(); });
})();

/* ══════════════════════════════════════
   VISIT
══════════════════════════════════════ */
(function () {
    if (!$('hoursTable')) return;
    var d = new Date().getDay();
    var order = [0, 1, 2, 3, 4, 5, 6];
    $('hoursTable').innerHTML = order.map(function (i) {
        return '<tr' + (i === d ? ' class="today"' : '') + '><th>' + DAYS[i] + (i === d ? ' <span>Today</span>' : '') + '</th><td>' + hoursLabel(i) + '</td></tr>';
    }).join('');
    $('admissionList').innerHTML = TICKET_TYPES.map(function (t) {
        return '<li><span><strong>' + t.label + '</strong>' + (t.note ? '<em>' + t.note + '</em>' : '') + '</span><b>' + (t.price ? money(t.price) : 'Free') + '</b></li>';
    }).join('');

    var floorTabs = document.querySelectorAll('.floor-tab');
    function showFloor(f) {
        floorTabs.forEach(function (t) {
            var on = +t.getAttribute('data-floor') === f;
            t.classList.toggle('active', on);
            t.setAttribute('aria-selected', on);
        });
        $('floorMap').innerHTML = floorMapSVG(f, null);
        $('floorList').innerHTML = MAP_LAYOUT[f].map(function (r) {
            var w = WINGS[r[0]];
            var link = (r[0] === 'greathall' || r[0] === 'shop') ? '' : ' href="collection.html?wing=' + r[0] + '"';
            return '<li><a' + link + '><strong>' + w.name + '</strong><span>' + (w.galleries ? (w.galleries.indexOf('–') > 0 ? 'Galleries ' : 'Gallery ') + w.galleries : (r[0] === 'greathall' ? 'Main entrance, information & tickets' : 'Gifts, books, coffee & lunch')) + '</span></a></li>';
        }).join('');
    }
    floorTabs.forEach(function (t) {
        t.addEventListener('click', function () { showFloor(+t.getAttribute('data-floor')); });
    });
    showFloor(1);
})();

/* ══════════════════════════════════════
   TICKETS (date → time → tickets → checkout)
══════════════════════════════════════ */
(function () {
    if (!$('tkCalendar')) return;
    var today = todayDate();
    var maxDate = new Date(today.getFullYear(), today.getMonth() + 3, today.getDate());
    var state = { date: null, time: null, qty: {}, view: new Date(today.getFullYear(), today.getMonth(), 1) };
    TICKET_TYPES.forEach(function (t) { state.qty[t.id] = 0; });

    function sameDay(a, b) { return a && b && a.getTime() === b.getTime(); }
    function isOpen(d) { return !!HOURS[d.getDay()].open && d >= today && d <= maxDate; }

    function renderCalendar() {
        var v = state.view;
        $('tkMonth').textContent = MONTHS[v.getMonth()] + ' ' + v.getFullYear();
        $('tkPrev').disabled = v.getFullYear() === today.getFullYear() && v.getMonth() === today.getMonth();
        $('tkNext').disabled = v >= new Date(maxDate.getFullYear(), maxDate.getMonth(), 1);
        var first = v.getDay();
        var days = new Date(v.getFullYear(), v.getMonth() + 1, 0).getDate();
        var html = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(function (d) { return '<span class="cal-dow">' + d + '</span>'; }).join('');
        for (var i = 0; i < first; i++) html += '<span></span>';
        for (var n = 1; n <= days; n++) {
            var d = new Date(v.getFullYear(), v.getMonth(), n);
            var ok = isOpen(d);
            var cls = 'cal-day' + (sameDay(d, state.date) ? ' selected' : '') + (sameDay(d, today) ? ' today' : '') + (!HOURS[d.getDay()].open ? ' closed' : '');
            html += '<button type="button" class="' + cls + '" data-day="' + n + '"' + (ok ? '' : ' disabled') + ' aria-label="' + fmtDate(d) + (ok ? '' : ', unavailable') + '">' + n + '</button>';
        }
        $('tkCalendar').innerHTML = html;
    }

    function slotsFor(d) {
        var h = HOURS[d.getDay()];
        var open = +h.open.split(':')[0] * 60, close = +h.close.split(':')[0] * 60 - 60;
        var now = new Date();
        var out = [];
        for (var m = open; m <= close; m += 30) {
            if (sameDay(d, today) && m <= now.getHours() * 60 + now.getMinutes()) continue;
            out.push(String(Math.floor(m / 60)).padStart(2, '0') + ':' + (m % 60 ? '30' : '00'));
        }
        return out;
    }

    function renderTimes() {
        var box = $('tkTimes');
        if (!state.date) { box.innerHTML = '<p class="tk-hint">Choose a date first.</p>'; return; }
        var slots = slotsFor(state.date);
        if (!slots.length) { box.innerHTML = '<p class="tk-hint">No entry times are left today. Please choose another date.</p>'; return; }
        box.innerHTML = slots.map(function (s) {
            return '<button type="button" class="slot' + (s === state.time ? ' selected' : '') + '" data-time="' + s + '">' + fmtTime(s) + '</button>';
        }).join('');
    }

    function renderQty() {
        $('tkTypes').innerHTML = TICKET_TYPES.map(function (t) {
            return '<div class="tk-type"><div><strong>' + t.label + '</strong>' + (t.note ? '<span>' + t.note + '</span>' : '') + '</div>' +
                '<b>' + (t.price ? money(t.price) : 'Free') + '</b>' +
                '<div class="stepper"><button type="button" data-step="-1" data-type="' + t.id + '" aria-label="Remove one ' + t.label + ' ticket"' + (state.qty[t.id] ? '' : ' disabled') + '>&minus;</button>' +
                '<output aria-live="polite">' + state.qty[t.id] + '</output>' +
                '<button type="button" data-step="1" data-type="' + t.id + '" aria-label="Add one ' + t.label + ' ticket"' + (state.qty[t.id] >= 10 ? ' disabled' : '') + '>+</button></div></div>';
        }).join('');
    }

    function totals() {
        var count = 0, sum = 0;
        TICKET_TYPES.forEach(function (t) { count += state.qty[t.id]; sum += state.qty[t.id] * t.price; });
        return { count: count, sum: sum };
    }

    function renderSummary() {
        var t = totals();
        var lines = TICKET_TYPES.filter(function (x) { return state.qty[x.id]; }).map(function (x) {
            return '<li><span>' + state.qty[x.id] + ' × ' + x.label + '</span><span>' + (x.price ? money(x.price * state.qty[x.id]) : 'Free') + '</span></li>';
        }).join('');
        $('tkSumDate').textContent = state.date ? DAYS[state.date.getDay()] + ', ' + fmtDate(state.date) : 'Not selected';
        $('tkSumTime').textContent = state.time ? fmtTime(state.time) : 'Not selected';
        $('tkSumLines').innerHTML = lines || '<li class="muted"><span>No tickets yet</span></li>';
        $('tkSumTotal').textContent = money(t.sum);

        var ready = state.date && state.time && t.count > 0;
        $('tkStep2').classList.toggle('locked', !state.date);
        $('tkStep3').classList.toggle('locked', !state.time);
        $('tkStep4').classList.toggle('locked', !ready);
        $('tkPayFields').hidden = t.sum === 0;
        $('tkPay').textContent = t.sum === 0 ? 'Reserve Free Tickets' : 'Pay ' + money(t.sum);
        $('tkPay').disabled = !ready;
        $('tkSumNote').textContent = ready ? '' : !state.date ? 'Pick a date to begin.' : !state.time ? 'Pick an entry time.' : 'Add at least one ticket.';
    }

    $('tkCalendar').addEventListener('click', function (e) {
        var b = e.target.closest('.cal-day');
        if (!b || b.disabled) return;
        state.date = new Date(state.view.getFullYear(), state.view.getMonth(), +b.getAttribute('data-day'));
        state.time = null;
        renderCalendar(); renderTimes(); renderSummary();
    });
    $('tkPrev').addEventListener('click', function () { state.view = new Date(state.view.getFullYear(), state.view.getMonth() - 1, 1); renderCalendar(); });
    $('tkNext').addEventListener('click', function () { state.view = new Date(state.view.getFullYear(), state.view.getMonth() + 1, 1); renderCalendar(); });
    $('tkTimes').addEventListener('click', function (e) {
        var b = e.target.closest('.slot');
        if (!b) return;
        state.time = b.getAttribute('data-time');
        renderTimes(); renderSummary();
    });
    $('tkTypes').addEventListener('click', function (e) {
        var b = e.target.closest('[data-step]');
        if (!b || b.disabled) return;
        var id = b.getAttribute('data-type');
        state.qty[id] = Math.max(0, Math.min(10, state.qty[id] + +b.getAttribute('data-step')));
        renderQty(); renderSummary();
        var again = $('tkTypes').querySelector('[data-type="' + id + '"][data-step="' + b.getAttribute('data-step') + '"]');
        if (again && !again.disabled) again.focus();
    });

    attachCardFormatting($('tkCard'), $('tkExp'), $('tkCvc'));

    $('tkForm').addEventListener('submit', function (e) {
        e.preventDefault();
        var t = totals();
        if (!(state.date && state.time && t.count)) return;
        var ok = validate([
            ['tkName', function (v) { return v.trim().length > 1; }],
            ['tkEmail', function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()); }]
        ]);
        if (t.sum > 0) ok = validatePayment('tkCard', 'tkExp', 'tkCvc', 'tkZip') && ok;
        if (!ok) { var bad = document.querySelector('#tkForm .invalid input'); if (bad) bad.focus(); return; }

        var order = 'AW-' + Math.random().toString(36).slice(2, 8).toUpperCase();
        $('tkConfOrder').textContent = order;
        $('tkConfWhen').textContent = DAYS[state.date.getDay()] + ', ' + fmtDate(state.date) + ' · Entry at ' + fmtTime(state.time);
        $('tkConfLines').innerHTML = $('tkSumLines').innerHTML;
        $('tkConfTotal').textContent = money(t.sum);
        $('tkConfEmail').textContent = $('tkEmail').value.trim();
        $('tkConfCode').innerHTML = codeSVG(order);
        $('tkBuilder').hidden = true;
        $('tkConfirm').hidden = false;
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    renderCalendar(); renderTimes(); renderQty(); renderSummary();
})();

/* ── Checkout helpers (tickets + membership) ── */
function setField(id, ok) {
    var f = $(id).closest('.field');
    f.classList.toggle('invalid', !ok);
    return ok;
}
function validate(rules) {
    var all = true;
    rules.forEach(function (r) { all = setField(r[0], r[1]($(r[0]).value)) && all; });
    return all;
}
function luhn(num) {
    var sum = 0, alt = false;
    for (var i = num.length - 1; i >= 0; i--) {
        var n = +num[i];
        if (alt) { n *= 2; if (n > 9) n -= 9; }
        sum += n; alt = !alt;
    }
    return sum % 10 === 0;
}
function validatePayment(card, exp, cvc, zip) {
    return validate([
        [card, function (v) { var d = v.replace(/\D/g, ''); return d.length >= 13 && d.length <= 19 && luhn(d); }],
        [exp, function (v) {
            var m = v.match(/^(\d{2})\s*\/\s*(\d{2})$/);
            if (!m || +m[1] < 1 || +m[1] > 12) return false;
            var end = new Date(2000 + +m[2], +m[1], 1);
            return end > new Date();
        }],
        [cvc, function (v) { return /^\d{3,4}$/.test(v.trim()); }],
        [zip, function (v) { return v.trim().length >= 3; }]
    ]);
}
function attachCardFormatting(card, exp, cvc) {
    card.addEventListener('input', function () {
        var d = this.value.replace(/\D/g, '').slice(0, 19);
        this.value = d.replace(/(.{4})/g, '$1 ').trim();
    });
    exp.addEventListener('input', function (e) {
        var d = this.value.replace(/\D/g, '').slice(0, 4);
        if (e.inputType && e.inputType.indexOf('delete') === 0) { this.value = d.length > 2 ? d.slice(0, 2) + ' / ' + d.slice(2) : d; return; }
        this.value = d.length >= 2 ? d.slice(0, 2) + ' / ' + d.slice(2) : d;
    });
    cvc.addEventListener('input', function () { this.value = this.value.replace(/\D/g, '').slice(0, 4); });
    [card, exp, cvc].forEach(function (el) {
        el.addEventListener('blur', function () { if (el.closest('.field').classList.contains('invalid')) el.closest('.field').classList.remove('invalid'); });
    });
}
/* decorative entry code built from the order number */
function codeSVG(seed) {
    var h = 0, cells = '';
    for (var i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
    for (var y = 0; y < 21; y++) {
        for (var x = 0; x < 21; x++) {
            var corner = (x < 7 && y < 7) || (x > 13 && y < 7) || (x < 7 && y > 13);
            var on;
            if (corner) {
                var cx = x > 13 ? x - 14 : x, cy = y > 13 ? y - 14 : y;
                on = cx === 0 || cy === 0 || cx === 6 || cy === 6 || (cx >= 2 && cx <= 4 && cy >= 2 && cy <= 4);
            } else {
                h = (h * 1103515245 + 12345) >>> 0;
                on = (h >>> 16) % 2 === 0;
            }
            if (on) cells += '<rect x="' + x + '" y="' + y + '" width="1" height="1"/>';
        }
    }
    return '<svg viewBox="-1 -1 23 23" aria-label="Entry code" role="img" shape-rendering="crispEdges"><rect x="-1" y="-1" width="23" height="23" fill="#fff"/><g fill="#13261D">' + cells + '</g></svg>';
}

/* ══════════════════════════════════════
   EVENTS
══════════════════════════════════════ */
(function () {
    var list = $('evList');
    if (!list) return;
    var type = qs('type');
    if (EVENT_TYPES.indexOf(type) < 0) type = '';
    var filters = $('evFilters');
    filters.innerHTML = '<button type="button" class="ev-filter" data-type="">All Events</button>' +
        EVENT_TYPES.map(function (t) { return '<button type="button" class="ev-filter" data-type="' + t + '">' + t + '</button>'; }).join('');

    function render() {
        filters.querySelectorAll('.ev-filter').forEach(function (b) {
            var on = b.getAttribute('data-type') === type;
            b.classList.toggle('active', on);
            b.setAttribute('aria-pressed', on);
        });
        var t = todayDate();
        var items = EVENTS.filter(function (e) { return parseDate(e.date) >= t && (!type || e.type === type); })
            .sort(function (a, b) { return parseDate(a.date) - parseDate(b.date) || a.time.localeCompare(b.time); });
        if (!items.length) { list.innerHTML = '<p class="ex-empty">No upcoming ' + (type ? type.toLowerCase() : 'events') + ' are scheduled yet. Check back soon.</p>'; return; }
        var html = '', month = '';
        items.forEach(function (e) {
            var d = parseDate(e.date);
            var m = MONTHS[d.getMonth()] + ' ' + d.getFullYear();
            if (m !== month) { html += '<h2 class="ev-month">' + m + '</h2>'; month = m; }
            var free = /free/i.test(e.price) && !/members only/i.test(e.price);
            var membersOnly = /members only/i.test(e.price);
            html += '<article class="ev-card" id="' + e.id + '">' + eventDateBlock(e) +
                '<div class="ev-body"><span class="eyebrow">' + e.type + '</span><h3>' + esc(e.title) + '</h3>' +
                '<p>' + esc(e.desc) + '</p>' +
                '<p class="ev-facts">' + e.time + ' · ' + e.length + '<span class="sep">·</span>' + esc(e.place) + '<span class="sep">·</span><strong>' + esc(e.price) + '</strong></p>' +
                '<div class="ev-register" hidden><form class="ev-form" novalidate>' +
                    '<div class="field"><label>Name</label><input type="text" name="name" autocomplete="name"><span class="err">Please enter your name.</span></div>' +
                    '<div class="field"><label>Email</label><input type="email" name="email" autocomplete="email"><span class="err">Please enter a valid email.</span></div>' +
                    '<div class="field"><label>Guests</label><select name="guests"><option>1</option><option>2</option><option>3</option><option>4</option></select></div>' +
                    '<button type="submit" class="btn btn-forest">Confirm</button></form>' +
                    '<p class="ev-done" hidden></p></div>' +
                '</div>' +
                '<div class="ev-cta">' + (free
                    ? '<a class="btn btn-line btn-small" href="tickets.html">Get Admission</a>'
                    : '<button type="button" class="btn btn-gold btn-small ev-open" aria-expanded="false" data-label="' + (membersOnly ? 'RSVP' : 'Register') + '">' + (membersOnly ? 'RSVP' : 'Register') + '</button>') + '</div>' +
                '</article>';
        });
        list.innerHTML = html;
    }

    filters.addEventListener('click', function (e) {
        var b = e.target.closest('.ev-filter');
        if (!b) return;
        type = b.getAttribute('data-type');
        history.replaceState(null, '', 'events.html' + (type ? '?type=' + type : ''));
        render();
    });
    list.addEventListener('click', function (e) {
        var b = e.target.closest('.ev-open');
        if (!b) return;
        var reg = b.closest('.ev-card').querySelector('.ev-register');
        reg.hidden = !reg.hidden;
        b.textContent = reg.hidden ? b.getAttribute('data-label') : 'Close';
        b.setAttribute('aria-expanded', !reg.hidden);
        if (!reg.hidden) reg.querySelector('input').focus();
    });
    list.addEventListener('submit', function (e) {
        var form = e.target.closest('.ev-form');
        if (!form) return;
        e.preventDefault();
        var name = form.querySelector('[name=name]'), mail = form.querySelector('[name=email]');
        var okN = name.value.trim().length > 1, okE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail.value.trim());
        name.closest('.field').classList.toggle('invalid', !okN);
        mail.closest('.field').classList.toggle('invalid', !okE);
        if (!okN || !okE) return;
        var g = form.querySelector('[name=guests]').value;
        var done = form.parentNode.querySelector('.ev-done');
        done.textContent = 'You’re registered, ' + name.value.trim().split(' ')[0] + '. We’ve saved ' + g + (g === '1' ? ' place' : ' places') + ' and sent the details to ' + mail.value.trim() + '.';
        done.hidden = false;
        form.hidden = true;
        var btn = form.closest('.ev-card').querySelector('.ev-open');
        if (btn) btn.remove();
    });

    render();
    if (location.hash) {
        var target = document.querySelector(location.hash.replace(/[^#\w-]/g, ''));
        if (target) setTimeout(function () { target.scrollIntoView({ block: 'center' }); target.classList.add('flash'); }, 60);
    }
})();

/* ══════════════════════════════════════
   MEMBERSHIP
══════════════════════════════════════ */
(function () {
    if (!$('tierGrid')) return;
    $('tierGrid').innerHTML = MEMBERSHIPS.map(function (m) {
        return '<div class="tier' + (m.featured ? ' featured' : '') + '">' +
            (m.featured ? '<span class="tier-flag">Most Popular</span>' : '') +
            '<h3>' + m.name + '</h3>' +
            '<p class="tier-price"><strong>' + money(m.price) + '</strong> / year</p>' +
            '<ul>' + m.perks.map(function (p) { return '<li>' + p + '</li>'; }).join('') + '</ul>' +
            '<button type="button" class="btn ' + (m.featured ? 'btn-gold' : 'btn-line') + '" data-tier="' + m.id + '">Join as ' + m.name + '</button>' +
            '</div>';
    }).join('');

    var sel = $('mTier');
    sel.innerHTML = MEMBERSHIPS.map(function (m) { return '<option value="' + m.id + '">' + m.name + ' — ' + money(m.price) + ' / year</option>'; }).join('');
    sel.value = 'dual';
    function syncTotal() {
        var m = MEMBERSHIPS.filter(function (x) { return x.id === sel.value; })[0];
        $('mTotal').textContent = money(m.price);
        $('mSubmit').textContent = 'Join for ' + money(m.price);
    }
    sel.addEventListener('change', syncTotal);
    syncTotal();

    document.addEventListener('click', function (e) {
        var b = e.target.closest('[data-tier]');
        if (!b) return;
        sel.value = b.getAttribute('data-tier');
        syncTotal();
        $('join').scrollIntoView({ behavior: 'smooth' });
        setTimeout(function () { $('mName').focus({ preventScroll: true }); }, 500);
    });

    attachCardFormatting($('mCard'), $('mExp'), $('mCvc'));
    $('mForm').addEventListener('submit', function (e) {
        e.preventDefault();
        var ok = validate([
            ['mName', function (v) { return v.trim().length > 1; }],
            ['mEmail', function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()); }]
        ]);
        ok = validatePayment('mCard', 'mExp', 'mCvc', 'mZip') && ok;
        if (!ok) { var bad = document.querySelector('#mForm .invalid input'); if (bad) bad.focus(); return; }
        var m = MEMBERSHIPS.filter(function (x) { return x.id === sel.value; })[0];
        $('mDoneName').textContent = $('mName').value.trim().split(' ')[0];
        $('mDoneTier').textContent = m.name;
        $('mDoneEmail').textContent = $('mEmail').value.trim();
        $('mForm').hidden = true;
        $('mDone').classList.add('show');
    });
})();

/* ── Simple contact form (About) ── */
(function () {
    var f = $('contactForm');
    if (!f) return;
    f.addEventListener('submit', function (e) {
        e.preventDefault();
        var ok = validate([
            ['cName', function (v) { return v.trim().length > 1; }],
            ['cEmail', function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()); }],
            ['cMsg', function (v) { return v.trim().length > 4; }]
        ]);
        if (!ok) return;
        f.hidden = true;
        $('contactDone').classList.add('show');
    });
})();

/* ── Scroll reveal ── */
(function () {
    var items = document.querySelectorAll('.reveal:not(.in)');
    if (!('IntersectionObserver' in window)) { items.forEach(function (el) { el.classList.add('in'); }); return; }
    var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
            if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
        });
    }, { rootMargin: '0px 0px -60px 0px', threshold: 0.08 });
    items.forEach(function (el) { io.observe(el); });
})();
