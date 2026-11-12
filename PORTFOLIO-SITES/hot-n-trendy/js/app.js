/* Renders the homepage from the catalogue in data.js. */
(function () {
    var D = window.HNT, P = D.products;
    var $ = function (s) { return document.querySelector(s); };
    var esc = function (s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
    var icon = function (id) { return '<svg class="icon"><use href="#i-' + id + '"/></svg>'; };
    var pf = function (key) { var p = D.platforms[key]; return '<span class="pf ' + key + '" title="' + esc(p.name) + '">' + p.short + '</span>'; };
    var money = function (n) { return '$' + n; };
    var byHeat  = P.slice().sort(function (a, b) { return b.heat - a.heat; });
    var byFrost = P.slice().sort(function (a, b) { return b.frost - a.frost; });
    var cheapestDupe = function (p) { return p.dupes.reduce(function (m, d) { return d.price < m.price ? d : m; }, p.dupes[0]); };
    var meter = function (kind, value) {
        return '<div class="meter ' + kind + '">' + icon(kind === 'heat' ? 'flame' : 'frost') +
            '<span class="bar"><i style="width:' + value + '%"></i></span><span>' + value + '</span></div>';
    };

    /* ── Ticker ── */
    var ticks = byHeat.map(function (p, i) {
        var rise = Math.round(p.heat * 3.2 - i * 11);
        return i % 3 === 2
            ? '<span class="tick"><span class="cool">' + icon('frost') + '</span><b>' + esc(p.name) + '</b> ' + Math.round(p.frost / 7) + ' weeks trending</span>'
            : '<span class="tick"><span class="up">' + icon('flame') + '</span><b>' + esc(p.name) + '</b> <span class="up">+' + rise + '%</span> on ' + D.platforms[p.platform].name + '</span>';
    }).join('');
    $('#ticker').innerHTML = ticks + ticks;     // doubled so the loop is seamless

    /* ── Cover product and heat index ── */
    var lead = P.filter(function (p) { return p.id === 'glaze-lip-oil'; })[0] || byHeat[0];
    $('#coverArt').innerHTML = hntArt(lead.art, lead.hue);
    $('#heatIndex').innerHTML = byHeat.slice(0, 5).map(function (p, i) {
        return '<li class="hi-item" data-id="' + p.id + '">' +
            '<span class="hi-rank">' + (i + 1) + '</span>' +
            '<span class="hi-thumb">' + hntArt(p.art, p.hue) + '</span>' +
            '<span><div class="hi-name">' + esc(p.name) + '</div><div class="hi-meta">' + pf(p.platform) + p.views + ' views</div></span>' +
            '<span class="hi-heat">' + icon('flame') + p.heat + '</span></li>';
    }).join('');

    /* ── Filters and the hot grid ── */
    var state = { pf: 'all', cat: 'all', q: '', all: false };
    var pfKeys = ['all'].concat(Object.keys(D.platforms).filter(function (k) { return P.some(function (p) { return p.platform === k; }); }));
    $('#pfFilters').innerHTML = pfKeys.map(function (k) {
        return '<button class="chip' + (k === 'all' ? ' on' : '') + '" data-pf="' + k + '">' + (k === 'all' ? 'All platforms' : pf(k) + D.platforms[k].name) + '</button>';
    }).join('');
    $('#catFilters').innerHTML = ['all'].concat(D.categories).map(function (c) {
        return '<button class="chip' + (c === 'all' ? ' on' : '') + '" data-cat="' + c + '">' + (c === 'all' ? 'Everything' : c) + '</button>';
    }).join('');

    function card(p) {
        var d = cheapestDupe(p), gap = Math.round((p.resale / p.retail - 1) * 100);
        return '<article class="card is-hot" data-id="' + p.id + '">' +
            '<div class="card-media">' + hntArt(p.art, p.hue) +
                '<div class="badges"><span class="views">' + pf(p.platform) + p.views + '</span>' +
                '<span class="status ' + p.status + '">' + (p.status === 'out' ? 'Sold out' : p.status === 'low' ? 'Low stock' : '') + '</span></div>' +
            '</div>' +
            '<div class="card-body">' +
                '<div><div class="card-brand">' + esc(p.brand) + ' · ' + esc(p.cat) + '</div><h3 class="card-name">' + esc(p.name) + '</h3></div>' +
                '<div class="card-tag">' + esc(p.tag) + '</div>' +
                meter('heat', p.heat) +
                '<div class="card-foot">' +
                    '<div><div class="price">' + money(p.retail) + '</div><div class="resale">Resale ' + money(p.resale) + ' <b>+' + gap + '%</b></div></div>' +
                    '<a class="dupe-link" href="#dupes">' + icon('frost') + 'Dupes from ' + money(d.price) + '</a>' +
                '</div>' +
            '</div></article>';
    }
    function renderGrid() {
        var q = state.q.toLowerCase();
        var list = byHeat.filter(function (p) {
            return (state.pf === 'all' || p.platform === state.pf) &&
                   (state.cat === 'all' || p.cat === state.cat) &&
                   (!q || (p.name + ' ' + p.brand + ' ' + p.cat + ' ' + p.art + ' ' + D.platforms[p.platform].name + ' ' + p.dupes.map(function (d) { return d.name; }).join(' ')).toLowerCase().indexOf(q) > -1);
        });
        var LIMIT = 8, shown = state.all ? list : list.slice(0, LIMIT);
        $('#hotGrid').innerHTML = list.length ? shown.map(card).join('') : '<p class="empty">Nothing that hot here yet. Try another filter.</p>';
        $('#moreBtn').hidden = state.all || list.length <= LIMIT;
    }
    function chipGroup(sel, key) {
        $(sel).addEventListener('click', function (e) {
            var b = e.target.closest('.chip'); if (!b) return;
            Array.prototype.forEach.call(this.querySelectorAll('.chip'), function (c) { c.classList.toggle('on', c === b); });
            state[key] = b.dataset[key];
            renderGrid();
        });
    }
    chipGroup('#pfFilters', 'pf');
    chipGroup('#catFilters', 'cat');
    $('#q').addEventListener('input', function () {
        state.q = this.value;
        renderGrid();
        if (this.value && window.scrollY < 300) document.getElementById('hot').scrollIntoView({ behavior: 'smooth' });
    });
    $('#moreBtn').addEventListener('click', function () { state.all = true; renderGrid(); });
    renderGrid();

    /* ── Collage ── */
    var spots = [
        { x: '2%',  y: 30,  r: -7, tape: 'hot' },  { x: '20%', y: 150, r: 5,  tape: '' },
        { x: '39%', y: 10,  r: -3, tape: 'cool' }, { x: '57%', y: 170, r: 8,  tape: 'hot' },
        { x: '76%', y: 40,  r: -6, tape: 'cool' }
    ];
    var picks = [P[5], P[2], P[8], P[3], P[4]];
    $('#collage').innerHTML = picks.map(function (p, i) {
        var s = spots[i];
        return '<figure class="polaroid" style="left:' + s.x + ';top:' + s.y + 'px;transform:rotate(' + s.r + 'deg)">' +
            '<span class="tape ' + s.tape + '"></span><div class="shot">' + hntArt(p.art, p.hue) + '</div>' +
            '<figcaption>' + esc(p.name.split(' ').slice(0, 2).join(' ').toLowerCase()) + ' <small>' + pf(p.platform).replace('class="pf', 'style="width:16px;height:16px;font-size:7px" class="pf') + '</small></figcaption></figure>';
    }).join('') +
        '<span class="cutout a" style="left:31%;top:478px;transform:rotate(-4deg)">Y2K is back</span>' +
        '<span class="cutout b" style="left:4%;top:470px;transform:rotate(3deg)">Sold out x3</span>' +
        '<span class="cutout c" style="left:66%;top:520px;transform:rotate(-2deg)">Under $70</span>' +
        '<span class="cutout d" style="left:83%;top:430px;transform:rotate(6deg)">Dupe alert</span>' +
        '<span class="scribble" style="left:50%;top:560px;transform:rotate(-6deg)">obsessed ✶</span>';

    /* ── Dupes: sold-out originals first ── */
    var dupeList = P.slice().sort(function (a, b) { return (b.status === 'out') - (a.status === 'out') || b.heat - a.heat; }).slice(0, 6);
    $('#dupeGrid').innerHTML = dupeList.map(function (p) {
        var d = p.dupes.slice().sort(function (a, b) { return b.match - a.match; })[0];
        var save = Math.round((1 - d.price / p.retail) * 100);
        var dupeHue = [p.hue[1], '#29e3ff'];
        return '<article class="dupe-card reveal">' +
            '<div class="vs">' +
                '<div class="vs-item orig"><div class="vs-shot">' + hntArt(p.art, p.hue) + (p.status === 'out' ? '<span class="sold-stamp">Sold out</span>' : '') + '</div>' +
                    '<div class="vs-name">' + esc(p.name) + '</div><div class="vs-price">' + money(p.retail) + '</div></div>' +
                '<div class="vs-mid">VS</div>' +
                '<div class="vs-item"><div class="vs-shot">' + hntArt(p.art, dupeHue) + '</div>' +
                    '<div class="vs-name">' + esc(d.name) + '</div><div class="vs-price">' + money(d.price) + '</div></div>' +
            '</div>' +
            '<div class="dupe-stats"><span class="stat save">Save ' + save + '%</span><span class="stat match">' + d.match + '% match</span><span class="stat match">by ' + esc(d.brand) + '</span></div>' +
            '<p class="dupe-note">Similar to ' + esc(p.brand) + ' ' + esc(p.name) + '. Sold under its own brand.</p>' +
        '</article>';
    }).join('');

    /* ── Still cool and resell boards ── */
    $('#coolRows').innerHTML = byFrost.slice(0, 5).map(function (p) {
        return '<div class="row"><span class="row-thumb">' + hntArt(p.art, p.hue) + '</span>' +
            '<div><div class="row-name">' + esc(p.name) + '</div>' + meter('frost', p.frost) + '</div>' +
            '<div class="row-weeks">' + Math.round(p.frost / 7) + '<small>weeks</small></div></div>';
    }).join('');
    $('#resellRows').innerHTML = P.slice().sort(function (a, b) { return (b.resale / b.retail) - (a.resale / a.retail); }).slice(0, 5).map(function (p) {
        var gap = Math.round((p.resale / p.retail - 1) * 100);
        return '<div class="row"><span class="row-thumb">' + hntArt(p.art, p.hue) + '</span>' +
            '<div><div class="row-name">' + esc(p.name) + '</div><div class="hi-meta" style="color:var(--ink-2)">' + pf(p.platform) + (p.status === 'out' ? 'Sold out at retail' : p.status === 'low' ? 'Low stock' : 'In stock') + '</div></div>' +
            '<div class="spread"><b>+' + gap + '%</b><span class="line">' + money(p.retail) + ' → ' + money(p.resale) + '</span></div></div>';
    }).join('');

    /* ── Menu on small screens ── */
    $('#menuBtn').addEventListener('click', function () {
        var open = $('#nav').classList.toggle('open');
        this.setAttribute('aria-expanded', open ? 'true' : 'false');
    });

    /* ── Reveal on scroll ── */
    var io = 'IntersectionObserver' in window ? new IntersectionObserver(function (es) {
        es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px' }) : null;
    Array.prototype.forEach.call(document.querySelectorAll('.reveal'), function (el) { io ? io.observe(el) : el.classList.add('in'); });
}());
