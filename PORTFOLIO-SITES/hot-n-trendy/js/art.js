/* Chrome product renders, drawn as SVG, standing in for product photos in the prototype.
   Each one is silver metal lit by the product's two neon colours. */
(function () {
    var n = 0;

    function defs(id, a, b) {
        return '<defs>' +
            '<linearGradient id="c' + id + '" x1="0" y1="0" x2="1" y2="1">' +
                '<stop offset="0" stop-color="#ffffff"/><stop offset=".22" stop-color="#c3cad3"/>' +
                '<stop offset=".45" stop-color="#f7f9fb"/><stop offset=".62" stop-color="#7d8692"/>' +
                '<stop offset=".8" stop-color="#e4e8ed"/><stop offset="1" stop-color="#9aa3ad"/></linearGradient>' +
            '<linearGradient id="h' + id + '" x1="0" y1="0" x2="1" y2="1">' +
                '<stop offset="0" stop-color="' + a + '"/><stop offset="1" stop-color="' + b + '"/></linearGradient>' +
            '<linearGradient id="g' + id + '" x1="0" y1="0" x2="0" y2="1">' +
                '<stop offset="0" stop-color="#fff" stop-opacity=".9"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/></linearGradient>' +
            '<radialGradient id="r' + id + '" cx=".5" cy=".55" r=".55">' +
                '<stop offset="0" stop-color="' + a + '" stop-opacity=".55"/><stop offset=".6" stop-color="' + b + '" stop-opacity=".18"/>' +
                '<stop offset="1" stop-color="' + b + '" stop-opacity="0"/></radialGradient>' +
        '</defs>';
    }
    // C = chrome, H = neon, G = gloss highlight
    var shapes = {
        bottle: function (C, H, G) { return '' +
            '<rect x="88" y="38" width="24" height="26" rx="4" fill="' + C + '"/>' +
            '<rect x="70" y="62" width="60" height="108" rx="22" fill="' + H + '" opacity=".92"/>' +
            '<rect x="70" y="62" width="60" height="108" rx="22" fill="none" stroke="' + C + '" stroke-width="5"/>' +
            '<rect x="80" y="72" width="12" height="80" rx="6" fill="' + G + '"/>' +
            '<circle cx="114" cy="140" r="6" fill="#fff" opacity=".55"/>'; },
        buds: function (C, H, G) { return '' +
            '<rect x="52" y="86" width="96" height="70" rx="34" fill="' + C + '"/>' +
            '<rect x="58" y="92" width="84" height="22" rx="11" fill="' + H + '" opacity=".85"/>' +
            '<path d="M58 118 h84" stroke="#5b636d" stroke-width="2" opacity=".5"/>' +
            '<circle cx="80" cy="74" r="16" fill="' + C + '"/><rect x="74" y="74" width="12" height="34" rx="6" fill="' + C + '"/>' +
            '<circle cx="122" cy="74" r="16" fill="' + C + '"/><rect x="116" y="74" width="12" height="34" rx="6" fill="' + C + '"/>' +
            '<circle cx="80" cy="74" r="7" fill="' + H + '"/><circle cx="122" cy="74" r="7" fill="' + H + '"/>' +
            '<rect x="62" y="96" width="30" height="8" rx="4" fill="' + G + '"/>'; },
        sneaker: function (C, H, G) { return '' +
            '<path d="M30 140 C30 110 52 98 74 96 L104 70 C112 64 124 66 128 76 L136 98 C156 100 170 112 172 140 Z" fill="' + C + '"/>' +
            '<path d="M26 140 H176 C178 152 170 160 158 160 H40 C30 160 24 152 26 140 Z" fill="' + H + '" opacity=".9"/>' +
            '<path d="M84 96 L112 80 M90 104 L118 88 M96 112 L124 96" stroke="#5b636d" stroke-width="4" stroke-linecap="round"/>' +
            '<path d="M44 124 C70 118 120 118 160 128" stroke="' + H + '" stroke-width="6" fill="none" stroke-linecap="round"/>' +
            '<path d="M40 136 C60 128 90 124 120 126" stroke="' + G + '" stroke-width="5" fill="none" stroke-linecap="round"/>'; },
        tumbler: function (C, H, G) { return '' +
            '<rect x="66" y="40" width="68" height="18" rx="6" fill="' + C + '"/>' +
            '<rect x="112" y="20" width="8" height="28" rx="4" fill="' + H + '"/>' +
            '<path d="M62 58 H138 L128 172 C127 178 122 182 116 182 H84 C78 182 73 178 72 172 Z" fill="' + C + '"/>' +
            '<path d="M134 72 C160 74 162 120 132 124" stroke="' + C + '" stroke-width="10" fill="none"/>' +
            '<path d="M66 96 H134 L131 132 H69 Z" fill="' + H + '" opacity=".88"/>' +
            '<rect x="76" y="62" width="10" height="110" rx="5" fill="' + G + '"/>'; },
        shades: function (C, H, G) { return '' +
            '<path d="M22 92 C60 72 140 72 178 92 L172 104 H28 Z" fill="' + C + '"/>' +
            '<path d="M30 100 C34 136 76 140 92 112 C96 104 104 104 108 112 C124 140 166 136 170 100 Z" fill="' + H + '" opacity=".9"/>' +
            '<path d="M30 100 C34 136 76 140 92 112 C96 104 104 104 108 112 C124 140 166 136 170 100" fill="none" stroke="' + C + '" stroke-width="5"/>' +
            '<path d="M44 108 C54 102 70 102 80 108" stroke="' + G + '" stroke-width="7" fill="none" stroke-linecap="round"/>' +
            '<path d="M122 108 C132 102 148 102 158 108" stroke="' + G + '" stroke-width="7" fill="none" stroke-linecap="round"/>'; },
        camera: function (C, H, G) { return '' +
            '<rect x="40" y="70" width="120" height="84" rx="14" fill="' + C + '"/>' +
            '<rect x="56" y="58" width="30" height="16" rx="5" fill="' + C + '"/>' +
            '<circle cx="110" cy="112" r="30" fill="#3a4049"/><circle cx="110" cy="112" r="22" fill="' + H + '" opacity=".95"/>' +
            '<circle cx="110" cy="112" r="11" fill="#1c2026"/><circle cx="103" cy="105" r="5" fill="#fff" opacity=".8"/>' +
            '<rect x="138" y="80" width="14" height="9" rx="2" fill="' + H + '"/>' +
            '<rect x="46" y="76" width="50" height="8" rx="4" fill="' + G + '"/>'; },
        clip: function (C, H, G) { return '' +
            '<path d="M60 70 C60 40 140 40 140 70 L132 98 H68 Z" fill="' + C + '"/>' +
            '<rect x="64" y="96" width="72" height="14" rx="7" fill="' + H + '"/>' +
            '<path d="M68 110 L60 160 M84 110 L80 166 M100 110 V168 M116 110 L120 166 M132 110 L140 160" stroke="' + C + '" stroke-width="9" stroke-linecap="round"/>' +
            '<path d="M74 60 C86 50 114 50 126 60" stroke="' + G + '" stroke-width="7" fill="none" stroke-linecap="round"/>'; },
        mask: function (C, H, G) { return '' +
            '<path d="M100 30 C150 30 164 76 160 112 C156 150 130 176 100 176 C70 176 44 150 40 112 C36 76 50 30 100 30 Z" fill="' + C + '"/>' +
            '<ellipse cx="78" cy="96" rx="16" ry="9" fill="#2a2f37"/><ellipse cx="122" cy="96" rx="16" ry="9" fill="#2a2f37"/>' +
            '<path d="M84 140 C94 148 106 148 116 140" stroke="#2a2f37" stroke-width="6" fill="none" stroke-linecap="round"/>' +
            '<g fill="' + H + '"><circle cx="70" cy="70" r="4"/><circle cx="100" cy="58" r="4"/><circle cx="130" cy="70" r="4"/>' +
            '<circle cx="58" cy="122" r="4"/><circle cx="142" cy="122" r="4"/><circle cx="100" cy="118" r="4"/>' +
            '<circle cx="80" cy="160" r="4"/><circle cx="120" cy="160" r="4"/></g>' +
            '<path d="M62 50 C74 40 90 36 100 36" stroke="' + G + '" stroke-width="8" fill="none" stroke-linecap="round"/>'; },
        perfume: function (C, H, G) { return '' +
            '<rect x="84" y="30" width="32" height="24" rx="5" fill="' + C + '"/>' +
            '<rect x="94" y="52" width="12" height="14" fill="' + C + '"/>' +
            '<rect x="54" y="64" width="92" height="110" rx="16" fill="' + H + '" opacity=".88"/>' +
            '<rect x="54" y="64" width="92" height="110" rx="16" fill="none" stroke="' + C + '" stroke-width="6"/>' +
            '<rect x="74" y="104" width="52" height="30" rx="3" fill="' + C + '"/>' +
            '<rect x="64" y="74" width="12" height="90" rx="6" fill="' + G + '"/>'; },
        bands: function (C, H, G) { return '' +
            '<ellipse cx="100" cy="88" rx="64" ry="30" fill="none" stroke="' + H + '" stroke-width="16"/>' +
            '<ellipse cx="100" cy="116" rx="58" ry="27" fill="none" stroke="' + C + '" stroke-width="16"/>' +
            '<ellipse cx="100" cy="142" rx="52" ry="24" fill="none" stroke="' + H + '" stroke-width="14" opacity=".75"/>' +
            '<path d="M56 104 C70 94 96 90 118 92" stroke="' + G + '" stroke-width="5" fill="none" stroke-linecap="round"/>'; }
    };

    window.hntArt = function (kind, hue) {
        var id = 'a' + (++n);
        var C = 'url(#c' + id + ')', H = 'url(#h' + id + ')', G = 'url(#g' + id + ')';
        return '<svg class="art" viewBox="0 0 200 200" aria-hidden="true">' + defs(id, hue[0], hue[1]) +
            '<ellipse cx="100" cy="112" rx="96" ry="86" fill="url(#r' + id + ')"/>' +
            '<ellipse cx="100" cy="186" rx="62" ry="7" fill="#1c2026" opacity=".16"/>' +
            (shapes[kind] || shapes.bottle)(C, H, G) + '</svg>';
    };
}());
