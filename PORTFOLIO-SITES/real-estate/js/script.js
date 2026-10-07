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

function cardHTML(l) {
    var badgeClass = l.status === 'New Listing' ? 'badge new' : 'badge';
    return '' +
        '<a class="card" href="property.html?id=' + l.id + '">' +
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

/* ── Listings: filters + sort ── */
(function () {
    var grid = document.getElementById('listingsGrid');
    if (!grid) return;

    var city  = document.getElementById('fCity');
    var type  = document.getElementById('fType');
    var price = document.getElementById('fPrice');
    var beds  = document.getElementById('fBeds');
    var sort  = document.getElementById('fSort');
    var count = document.getElementById('resultCount');
    var reset = document.getElementById('fReset');
    var empty = document.getElementById('noResults');

    fillCitySelect(city);

    var params = new URLSearchParams(window.location.search);
    if (params.get('city'))  city.value  = params.get('city');
    if (params.get('type'))  type.value  = params.get('type');
    if (params.get('price')) price.value = params.get('price');

    function render() {
        var maxPrice = parseInt(price.value, 10) || Infinity;
        var minBeds  = parseInt(beds.value, 10) || 0;

        var results = LISTINGS.filter(function (l) {
            return (!city.value || l.city === city.value) &&
                   (!type.value || l.type === type.value) &&
                   l.price <= maxPrice &&
                   l.beds >= minBeds;
        });

        if (sort.value === 'low')  results.sort(function (a, b) { return a.price - b.price; });
        if (sort.value === 'high') results.sort(function (a, b) { return b.price - a.price; });
        if (sort.value === 'size') results.sort(function (a, b) { return b.sqft - a.sqft; });

        grid.innerHTML = results.map(cardHTML).join('');
        count.textContent = results.length + (results.length === 1 ? ' home' : ' homes');
        empty.style.display = results.length ? 'none' : 'block';
    }

    [city, type, price, beds, sort].forEach(function (el) { el.addEventListener('change', render); });
    reset.addEventListener('click', function () {
        city.value = ''; type.value = ''; price.value = ''; beds.value = ''; sort.value = 'featured';
        render();
    });

    render();
}());

/* ── Property detail ── */
(function () {
    var root = document.getElementById('propertyRoot');
    if (!root) return;

    var id = new URLSearchParams(window.location.search).get('id');
    var l  = findListing(id) || LISTINGS[0];

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
    document.getElementById('similarGrid').innerHTML = similar.map(cardHTML).join('');
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
