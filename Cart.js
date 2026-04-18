/* Cart.js — shared cart logic for all pages */
(function () {

    // ── State ─────────────────────────────────────────────────────────────────
    var cart = [];
    try {
        var _raw = sessionStorage.getItem('noiseCart');
        if (_raw) cart = JSON.parse(_raw);
    } catch (e) {}

    function save() {
        try { sessionStorage.setItem('noiseCart', JSON.stringify(cart)); } catch (e) {}
    }

    function cartTotal() {
        return cart.reduce(function (s, i) { return s + parseFloat(i.price || 0); }, 0);
    }

    // ── Badge ─────────────────────────────────────────────────────────────────
    function updateBadge() {
        var n = cart.length;
        ['cartBadge', 'mobileBadge'].forEach(function (id) {
            var el = document.getElementById(id);
            if (!el) return;
            el.textContent = n;
            el.classList.toggle('visible', n > 0);
        });
    }

    // ── Render drawer ─────────────────────────────────────────────────────────
    function render() {
        var list = document.getElementById('cartItemsList');
        if (!list) return;
        list.querySelectorAll('.cart-item-row').forEach(function (el) { el.remove(); });
        var empty   = document.getElementById('cartEmpty');
        var totalEl = document.getElementById('cartTotal');
        if (cart.length === 0) {
            if (empty) empty.style.display = 'block';
        } else {
            if (empty) empty.style.display = 'none';
            cart.forEach(function (item, idx) {
                var row = document.createElement('div');
                row.className = 'cart-item-row';
                row.innerHTML =
                    '<img class="cart-item-img" src="' + item.front + '" alt="' + item.name + '">' +
                    '<div class="cart-item-details">' +
                        '<p class="cart-item-name">' + item.name + '</p>' +
                        '<p class="cart-item-meta">Size: ' + item.size + '</p>' +
                        '<p class="cart-item-price">$' + item.price + '</p>' +
                    '</div>' +
                    '<button class="cart-item-remove" data-idx="' + idx + '">×</button>';
                list.appendChild(row);
            });
        }
        if (totalEl) totalEl.textContent = '$' + cartTotal();
        updateBadge();
    }

    // ── Open / Close ──────────────────────────────────────────────────────────
    function openCart() {
        var bg = document.getElementById('cartOverlayBg');
        var dr = document.getElementById('cartDrawer');
        if (bg) bg.classList.add('open');
        if (dr) dr.classList.add('open');
    }
    function closeCart() {
        var bg = document.getElementById('cartOverlayBg');
        var dr = document.getElementById('cartDrawer');
        if (bg) bg.classList.remove('open');
        if (dr) dr.classList.remove('open');
    }

    // ── Public API ────────────────────────────────────────────────────────────
    window.NoiseCart = {
        getCart: function () { return cart; },
        add: function (item) { cart.push(item); save(); render(); },
        remove: function (idx) {
            var item = cart.splice(idx, 1)[0];
            save();
            render();
            // Let shop page restock inventory if needed
            if (typeof window.noiseCartOnRemove === 'function') window.noiseCartOnRemove(item);
        },
        open:   openCart,
        close:  closeCart,
        render: render,
        save:   save
    };

    // ── Wire up DOM ───────────────────────────────────────────────────────────
    document.addEventListener('DOMContentLoaded', function () {
        render();

        ['cartIconBtn', 'mobileCartBtn'].forEach(function (id) {
            var el = document.getElementById(id);
            if (el) el.addEventListener('click', function () {
                var dr = document.getElementById('cartDrawer');
                if (dr && dr.classList.contains('open')) closeCart(); else openCart();
            });
        });

        var closeBtn = document.getElementById('cartDrawerClose');
        if (closeBtn) closeBtn.addEventListener('click', closeCart);

        var bg = document.getElementById('cartOverlayBg');
        if (bg) bg.addEventListener('click', closeCart);

        var list = document.getElementById('cartItemsList');
        if (list) {
            list.addEventListener('click', function (e) {
                var btn = e.target.closest('.cart-item-remove');
                if (!btn) return;
                window.NoiseCart.remove(parseInt(btn.dataset.idx, 10));
            });
        }

        var chk = document.getElementById('checkoutBtn');
        if (chk) chk.addEventListener('click', function () {
            if (cart.length === 0) return;
            chk.textContent = 'Processing...';
            chk.disabled = true;
            fetch('stripe-checkout.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ items: cart })
            })
            .then(function(r) { return r.json(); })
            .then(function(data) {
                if (data.url) {
                    window.location.href = data.url;
                } else {
                    alert('Something went wrong. Please try again.');
                    chk.textContent = 'Checkout';
                    chk.disabled = false;
                }
            })
            .catch(function() {
                alert('Something went wrong. Please try again.');
                chk.textContent = 'Checkout';
                chk.disabled = false;
            });
        });
    });

}());
