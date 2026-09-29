(function () {
    var items      = document.querySelectorAll('.grid-item');
    var lightbox   = document.getElementById('lightbox');
    var lbVideo    = document.getElementById('lbVideo');
    var lbClose    = document.getElementById('lbClose');
    var lbCat      = document.getElementById('lbCat');
    var lbTitle    = document.getElementById('lbTitle');

    function openLightbox(item) {
        var src = item.dataset.video;
        lbVideo.src = src || '';
        lbCat.textContent = item.dataset.cat || '';
        lbTitle.textContent = item.dataset.title || '';
        lightbox.classList.add('open');
        if (src) lbVideo.play().catch(function () {});
    }

    function closeLightbox() {
        lightbox.classList.remove('open');
        lbVideo.pause();
        lbVideo.src = '';
    }

    items.forEach(function (item) {
        item.addEventListener('click', function () { openLightbox(item); });
    });

    lbClose.addEventListener('click', closeLightbox);
    lightbox.addEventListener('click', function (e) {
        if (e.target === lightbox) closeLightbox();
    });
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && lightbox.classList.contains('open')) closeLightbox();
    });
}());
