// Portfolio Gallery JS — mirrors Gallery.js

let imagesContainer = document.querySelector('.scrollable-images');
let images = document.querySelectorAll('.scrollable-images img');
let modal = document.getElementById('myModal');
let modalImg = document.getElementById('modalImage');
let captionText = document.getElementById('caption');

let scrollPosition = 0;
let imageIndex = 0;

function openModal(src, alt) {
    if (!modal) return;
    modal.style.display = window.innerWidth <= 768 ? 'flex' : 'block';
    if (modalImg) modalImg.src = src;
    if (captionText) captionText.innerHTML = alt;
}

function closeModal() {
    if (!modal) return;
    modal.style.display = 'none';
}

// Block modal opens during the initial scroll-snap positioning phase on mobile
let pageReady = false;
setTimeout(function () { pageReady = true; }, 500);

images.forEach(function (img, index) {
    img.setAttribute('draggable', 'false');

    img.onload = function () {
        updateImagePositions();
    };

    img.onclick = function () {
        if (!pageReady) return;
        openModal(this.src, this.alt);
        imageIndex = index;
    };
});

if (imagesContainer) {
    imagesContainer.addEventListener('wheel', function (e) {
        if (!images.length) return;
        scrollPosition += e.deltaY;
        scrollPosition = Math.min(imagesContainer.scrollWidth - imagesContainer.clientWidth, Math.max(0, scrollPosition));
        imagesContainer.scrollLeft = scrollPosition;
        imageIndex = Math.round(scrollPosition / images[0].offsetWidth);
        e.preventDefault();
    });

    imagesContainer.addEventListener('mousewheel', function (e) {
        if (!images.length) return;
        scrollPosition += e.deltaY;
        scrollPosition = Math.min(imagesContainer.scrollWidth - imagesContainer.clientWidth, Math.max(0, scrollPosition));
        imagesContainer.scrollLeft = scrollPosition;
        imageIndex = Math.round(scrollPosition / images[0].offsetWidth);
        e.preventDefault();
    });
}

window.addEventListener('resize', updateImagePositions);

function updateImagePositions() {
    if (!imagesContainer || !images.length) return;
    const centerIndex = Math.floor(images.length / 2);
    scrollPosition = centerIndex * images[0].offsetWidth - imagesContainer.offsetWidth / 2;
    scrollPosition = Math.min(imagesContainer.scrollWidth - imagesContainer.clientWidth, Math.max(0, scrollPosition));
    imagesContainer.scrollLeft = scrollPosition;
    imageIndex = centerIndex;
}
updateImagePositions();

// Dock hover effect
const dockContainer = document.querySelector('.scrollable-images');
const dockItems = document.querySelectorAll('.scrollable-images img');

const updateDockItems = (hoveredItemIndex) => {
    dockItems.forEach((item, index) => {
        item.style.transform = index === hoveredItemIndex ? 'scale(1.3)' : '';
        item.style.margin    = index === hoveredItemIndex ? '0 10px' : '';
    });
};
dockItems.forEach((item, index) => {
    item.addEventListener('mouseenter', () => { updateDockItems(index); });
});
if (dockContainer) {
    dockContainer.addEventListener('mouseleave', () => {
        dockItems.forEach((item) => { item.style.transform = ''; item.style.margin = ''; });
    });
}

document.addEventListener('keydown', function (event) {
    if (event.keyCode === 27) closeModal();
});

// ── Hamburger nav ──
(function () {
    var btn     = document.getElementById('mobileHamburger');
    var menu    = document.getElementById('mobileNavMenu');
    var overlay = document.getElementById('mobileNavOverlay');
    if (!btn || !menu || !overlay) return;
    function toggleNav() { menu.classList.toggle('open'); overlay.classList.toggle('open'); }
    btn.addEventListener('click', toggleNav);
    overlay.addEventListener('click', toggleNav);
}());

// ── Mobile modal fix ──
(function () {
    if (window.innerWidth > 768) return;
    var modal       = document.getElementById('myModal');
    var mobileClose = document.getElementById('mobileModalClose');
    var innerClose  = document.querySelector('#myModal .close');
    if (innerClose && innerClose.parentNode) innerClose.parentNode.removeChild(innerClose);
    if (modal) {
        modal.style.flexDirection  = 'column';
        modal.style.alignItems     = 'center';
        modal.style.justifyContent = 'center';
        modal.style.padding        = '52px 8px 12px';
        modal.style.boxSizing      = 'border-box';
        modal.style.overflowY      = 'hidden';
    }
    var _open  = window.openModal;
    var _close = window.closeModal;
    window.openModal = function (src, alt) {
        if (_open) _open(src, alt);
        if (modal) { modal.style.justifyContent = 'center'; modal.style.alignItems = 'center'; }
        if (mobileClose) mobileClose.style.display = 'block';
    };
    window.closeModal = function () {
        if (_close) _close();
        if (mobileClose) mobileClose.style.display = 'none';
    };
    if (mobileClose) mobileClose.onclick = function () { window.closeModal(); };
}());
