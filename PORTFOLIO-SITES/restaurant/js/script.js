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

/* ── Reservations page: calendar + time picker → details → thank you
   (front-end only — no backend wired up yet) ── */
(function () {
    var calDays = document.getElementById('calDays');
    if (!calDays) return;

    var monthLabel  = document.getElementById('calMonthLabel');
    var prevBtn     = document.getElementById('calPrev');
    var nextBtn     = document.getElementById('calNext');
    var timeGrid    = document.getElementById('timeGrid');
    var detailsRow  = document.getElementById('detailsRow');
    var submitWrap  = document.getElementById('reserveSubmitWrap');
    var form        = document.getElementById('reservationForm');
    var flow        = document.getElementById('reserveFlow');
    var thanks      = document.getElementById('reserveThanks');
    var thanksText  = document.getElementById('thanksSummary');

    var MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];

    var today = new Date();
    today.setHours(0, 0, 0, 0);
    var viewYear  = today.getFullYear();
    var viewMonth = today.getMonth();
    var selectedDate = null;
    var selectedTime = null;

    function isSameDay(a, b) {
        return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
    }

    function renderCalendar() {
        monthLabel.textContent = MONTH_NAMES[viewMonth] + ' ' + viewYear;
        calDays.innerHTML = '';

        var firstDay      = new Date(viewYear, viewMonth, 1);
        var startWeekday  = firstDay.getDay();
        var daysInMonth   = new Date(viewYear, viewMonth + 1, 0).getDate();

        for (var i = 0; i < startWeekday; i++) {
            var empty = document.createElement('span');
            empty.className = 'cal-day empty';
            calDays.appendChild(empty);
        }

        for (var d = 1; d <= daysInMonth; d++) {
            var cellDate = new Date(viewYear, viewMonth, d);
            var btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'cal-day';
            btn.textContent = d;

            var isPast   = cellDate < today;
            var isMonday = cellDate.getDay() === 1; // closed Mondays

            if (isPast || isMonday) {
                btn.classList.add('disabled');
                btn.disabled = true;
            } else {
                (function (dayDate, el) {
                    el.addEventListener('click', function () {
                        selectedDate = dayDate;
                        calDays.querySelectorAll('.cal-day').forEach(function (c) { c.classList.remove('selected'); });
                        el.classList.add('selected');
                        checkReady();
                    });
                })(cellDate, btn);
            }

            if (selectedDate && isSameDay(cellDate, selectedDate)) btn.classList.add('selected');
            calDays.appendChild(btn);
        }
    }

    prevBtn.addEventListener('click', function () {
        viewMonth--;
        if (viewMonth < 0) { viewMonth = 11; viewYear--; }
        renderCalendar();
    });
    nextBtn.addEventListener('click', function () {
        viewMonth++;
        if (viewMonth > 11) { viewMonth = 0; viewYear++; }
        renderCalendar();
    });

    timeGrid.addEventListener('click', function (e) {
        var btn = e.target.closest('.time-slot');
        if (!btn) return;
        timeGrid.querySelectorAll('.time-slot').forEach(function (t) { t.classList.remove('selected'); });
        btn.classList.add('selected');
        selectedTime = btn.textContent.trim();
        checkReady();
    });

    function checkReady() {
        if (selectedDate && selectedTime) {
            detailsRow.classList.add('visible');
            submitWrap.classList.add('visible');
        }
    }

    form.addEventListener('submit', function (e) {
        e.preventDefault();
        if (!selectedDate || !selectedTime) return;

        var guests  = document.getElementById('resGuests').value;
        var dateStr = selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
        var party   = guests === '1' ? '1 guest' : guests + ' guests';

        thanksText.textContent = 'We’ve reserved a table for ' + party + ' on ' + dateStr + ' at ' + selectedTime + '.';
        flow.style.display = 'none';
        thanks.classList.add('visible');
    });

    renderCalendar();
}());
