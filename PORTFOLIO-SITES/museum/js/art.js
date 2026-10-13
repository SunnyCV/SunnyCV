/* ══════════════════════════════════════
   Drawn artwork placeholders, the museum facade, floor maps and icons.
   Every artwork renders through artHTML(): if the object has an `image`
   (a real photo), that is used; otherwise a drawn placeholder stands in.
══════════════════════════════════════ */

var artSeq = 0;

function svgOpen(id, label) {
    return '<svg viewBox="0 0 400 500" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="' + label + '">';
}

/* soft canvas grain laid over painted placeholders */
function grain(id) {
    return '<filter id="' + id + 'n"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/></filter>' ;
}
function grainRect(id, op) {
    return '<rect width="400" height="500" filter="url(#' + id + 'n)" opacity="' + (op || 0.10) + '" style="mix-blend-mode:multiply"/>';
}
function vgrad(id, a, b) {
    return '<linearGradient id="' + id + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + a + '"/><stop offset="1" stop-color="' + b + '"/></linearGradient>';
}
function rgrad(id, a, b, cx, cy) {
    return '<radialGradient id="' + id + '" cx="' + (cx || 0.5) + '" cy="' + (cy || 0.4) + '" r="0.75"><stop offset="0" stop-color="' + a + '"/><stop offset="1" stop-color="' + b + '"/></radialGradient>';
}

var ART = {
    landscape: function (id, v) {
        var P = [
            ['#8FC3E0', '#F4E6C3', '#3C7FAE', '#8DAE62', '#4F7A3E', '#1F3D28', '#F7D27A'],
            ['#3E5C86', '#F1B98A', '#2F5D7C', '#6C7F4E', '#43573A', '#1A2E20', '#F6C27D'],
            ['#B9D6E2', '#F7EED8', '#5E93A8', '#A7B86A', '#6E8E4C', '#2E4B2E', '#FBE6A6']
        ][v % 3];
        return '<defs>' + vgrad(id + 's', P[0], P[1]) + grain(id) + '</defs>' +
            '<rect width="400" height="500" fill="url(#' + id + 's)"/>' +
            '<circle cx="' + (v === 1 ? 290 : 110) + '" cy="' + (v === 1 ? 250 : 120) + '" r="' + (v === 1 ? 46 : 34) + '" fill="' + P[6] + '" opacity="0.92"/>' +
            '<ellipse cx="250" cy="110" rx="90" ry="18" fill="#fff" opacity="0.35"/><ellipse cx="300" cy="95" rx="60" ry="14" fill="#fff" opacity="0.3"/>' +
            '<rect y="268" width="400" height="44" fill="' + P[2] + '"/>' +
            '<path d="M0 290 C 80 250, 150 262, 220 280 S 340 262, 400 250 V500 H0Z" fill="' + P[3] + '"/>' +
            '<path d="M0 360 C 90 320, 200 340, 280 360 S 380 350, 400 340 V500 H0Z" fill="' + P[4] + '"/>' +
            '<g fill="' + P[5] + '">' +
                '<path d="M70 380 C 58 300, 66 220, 78 170 C 90 220, 98 300, 86 380Z"/>' +
                '<path d="M100 385 C 92 320, 96 260, 104 225 C 112 260, 116 320, 110 385Z"/>' +
                '<path d="M318 372 C 306 320, 312 270, 322 240 C 332 270, 336 320, 328 372Z"/>' +
            '</g>' +
            '<path d="M0 430 C 120 400, 260 420, 400 400 V500 H0Z" fill="' + P[5] + '" opacity="0.55"/>' +
            grainRect(id, 0.12);
    },

    seascape: function (id, v) {
        var P = [
            ['#9BCBE4', '#FBF0D4', '#2D6E9E', '#1E4E79', '#F4EBDD', '#6B4A30'],
            ['#5F7D99', '#D9C9A8', '#2F4F66', '#1C3348', '#E8E0D0', '#3B2A1C']
        ][v % 2];
        return '<defs>' + vgrad(id + 's', P[0], P[1]) + vgrad(id + 'w', P[2], P[3]) + grain(id) + '</defs>' +
            '<rect width="400" height="500" fill="url(#' + id + 's)"/>' +
            '<ellipse cx="120" cy="120" rx="110" ry="30" fill="#fff" opacity="0.4"/><ellipse cx="300" cy="170" rx="80" ry="20" fill="#fff" opacity="0.3"/>' +
            '<rect y="300" width="400" height="200" fill="url(#' + id + 'w)"/>' +
            '<g stroke="#fff" stroke-opacity="0.35" stroke-width="3" fill="none">' +
                '<path d="M20 340 q20 -10 40 0 t40 0"/><path d="M220 360 q20 -10 40 0 t40 0"/><path d="M90 410 q25 -12 50 0 t50 0"/><path d="M260 440 q25 -12 50 0 t50 0"/>' +
            '</g>' +
            '<path d="M150 318 L 270 318 L 250 342 L 168 342 Z" fill="' + P[5] + '"/>' +
            '<rect x="208" y="170" width="4" height="150" fill="' + P[5] + '"/>' +
            '<path d="M212 175 L 212 300 L 268 300 Z" fill="' + P[4] + '"/>' +
            '<path d="M208 190 L 208 300 L 160 300 Z" fill="' + P[4] + '" opacity="0.92"/>' +
            grainRect(id, 0.12);
    },

    portrait: function (id, v) {
        var P = [
            ['#2C2A20', '#4A4433', '#1A1A18', '#E7C3A0', '#3B2A1C', '#F2EDE2'],
            ['#1E2D24', '#3B4E3D', '#20334A', '#E2B996', '#5A3E2B', '#D9C08A'],
            ['#3A2622', '#5A3B30', '#7A1F22', '#EAC6A4', '#2A1D14', '#C9A24A']
        ][v % 3];
        return '<defs>' + rgrad(id + 'b', P[1], P[0], 0.5, 0.35) + rgrad(id + 'f', '#F6DAC0', P[3], 0.45, 0.4) + grain(id) + '</defs>' +
            '<rect width="400" height="500" fill="url(#' + id + 'b)"/>' +
            '<path d="M52 500 C 62 400, 130 352, 200 350 C 270 352, 338 400, 348 500 Z" fill="' + P[2] + '"/>' +
            (v % 3 === 0
                ? '<path d="M128 372 C 160 395, 240 395, 272 372 C 262 400, 230 412, 200 412 C 170 412, 138 400, 128 372Z" fill="' + P[5] + '"/>'
                : '<path d="M184 352 L 200 420 L 216 352 Z" fill="' + P[5] + '" opacity="0.85"/>') +
            '<rect x="178" y="290" width="44" height="70" rx="16" fill="' + P[3] + '"/>' +
            '<ellipse cx="200" cy="232" rx="60" ry="76" fill="url(#' + id + 'f)"/>' +
            '<path d="M138 232 C 132 160, 170 140, 200 140 C 238 140, 270 162, 262 236 C 254 196, 236 180, 200 178 C 166 180, 146 196, 138 232Z" fill="' + P[4] + '"/>' +
            '<ellipse cx="178" cy="234" rx="6" ry="4" fill="#3A2A1E" opacity="0.7"/><ellipse cx="222" cy="234" rx="6" ry="4" fill="#3A2A1E" opacity="0.7"/>' +
            '<path d="M186 276 q14 8 28 0" stroke="#9A5A48" stroke-width="3" fill="none" opacity="0.6"/>' +
            grainRect(id, 0.14);
    },

    stilllife: function (id) {
        return '<defs>' + rgrad(id + 'b', '#4A4433', '#1D1A14', 0.35, 0.3) + grain(id) + '</defs>' +
            '<rect width="400" height="500" fill="url(#' + id + 'b)"/>' +
            '<rect y="330" width="400" height="170" fill="#4A3220"/><rect y="330" width="400" height="10" fill="#6B4A30"/>' +
            '<path d="M230 180 C 230 150, 300 150, 300 180 L 312 320 C 312 336, 218 336, 218 320 Z" fill="#8E9499"/>' +
            '<path d="M300 200 C 340 200, 340 260, 306 262" stroke="#7A8085" stroke-width="10" fill="none"/>' +
            '<path d="M70 300 C 70 350, 210 350, 210 300 Z" fill="#C9A24A"/>' +
            '<circle cx="105" cy="285" r="26" fill="#E58A2E"/><circle cx="150" cy="278" r="28" fill="#E9962F"/><circle cx="128" cy="258" r="22" fill="#9C2F22"/><circle cx="180" cy="292" r="20" fill="#6C8E3A"/>' +
            '<circle cx="270" cy="345" r="18" fill="#E58A2E"/>' +
            grainRect(id, 0.14);
    },

    ink: function (id, v) {
        var paper = v % 2 ? '#EADFC8' : '#F1E8D4';
        return '<defs>' + grain(id) + '</defs>' +
            '<rect width="400" height="500" fill="' + paper + '"/>' +
            '<path d="M0 250 L 70 120 L 120 190 L 180 60 L 260 210 L 310 150 L 400 270 V500 H0Z" fill="#3D4A45" opacity="0.22"/>' +
            '<path d="M0 320 L 90 210 L 150 280 L 230 170 L 320 300 L 400 240 V500 H0Z" fill="#2B3532" opacity="0.38"/>' +
            '<rect y="300" width="400" height="40" fill="' + paper + '" opacity="0.7"/>' +
            '<path d="M0 420 L 120 340 L 210 400 L 300 350 L 400 410 V500 H0Z" fill="#1C2420" opacity="0.6"/>' +
            '<g stroke="#1C2420" stroke-width="3" fill="none" opacity="0.85"><path d="M300 470 C 300 420, 296 380, 304 340"/><path d="M302 360 l -34 -6 M303 380 l 32 -8 M301 400 l -38 -4 M302 420 l 30 -6"/></g>' +
            '<rect x="40" y="40" width="22" height="22" fill="#B4432F"/>' +
            grainRect(id, 0.10);
    },

    abstract: function (id, v) {
        if (v % 2) {
            return '<defs>' + grain(id) + '</defs>' +
                '<rect width="400" height="500" fill="#2F4A3B"/>' +
                '<rect x="30" y="40" width="340" height="190" fill="#C98F2E" opacity="0.92"/>' +
                '<rect x="30" y="260" width="340" height="200" fill="#3E6B4A" opacity="0.95"/>' +
                grainRect(id, 0.16);
        }
        return '<defs>' + grain(id) + '</defs>' +
            '<rect width="400" height="500" fill="#F4EFE4"/>' +
            '<rect x="40" y="40" width="190" height="230" fill="#1E4E79"/>' +
            '<rect x="250" y="40" width="110" height="110" fill="#E2BF62"/>' +
            '<circle cx="305" cy="300" r="70" fill="#B4432F"/>' +
            '<rect x="40" y="300" width="120" height="160" fill="#1F3A2E"/>' +
            '<rect x="180" y="400" width="180" height="60" fill="#7FC8C2"/>' +
            '<path d="M230 0 V500 M0 285 H400" stroke="#1C2420" stroke-width="6"/>' +
            grainRect(id, 0.10);
    },

    sculpture: function (id, v) {
        var bronze = v % 2 === 1;
        var hi = bronze ? '#B8894A' : '#FBF8F1', lo = bronze ? '#4E3A20' : '#BDB6A6';
        return '<defs>' + rgrad(id + 'b', '#2F4A3B', '#13261D', 0.5, 0.35) + rgrad(id + 'm', hi, lo, 0.38, 0.3) + '</defs>' +
            '<rect width="400" height="500" fill="url(#' + id + 'b)"/>' +
            '<path d="M110 500 V170 C 110 110, 160 70, 200 60 C 240 70, 290 110, 290 170 V500Z" fill="#000" opacity="0.18"/>' +
            '<rect x="130" y="410" width="140" height="90" fill="#D8D1C1"/><rect x="120" y="400" width="160" height="16" fill="#E9E3D5"/>' +
            '<path d="M120 400 C 120 330, 160 316, 200 314 C 240 316, 280 330, 280 400 Z" fill="url(#' + id + 'm)"/>' +
            '<path d="M150 340 C 180 360, 230 330, 262 360" stroke="' + lo + '" stroke-width="3" fill="none" opacity="0.6"/>' +
            '<rect x="182" y="270" width="36" height="56" rx="12" fill="url(#' + id + 'm)"/>' +
            '<ellipse cx="200" cy="222" rx="48" ry="60" fill="url(#' + id + 'm)"/>' +
            '<g fill="url(#' + id + 'm)"><circle cx="160" cy="190" r="16"/><circle cx="178" cy="168" r="17"/><circle cx="202" cy="160" r="18"/><circle cx="226" cy="168" r="17"/><circle cx="242" cy="190" r="15"/></g>' +
            '<path d="M200 220 v22" stroke="' + lo + '" stroke-width="3" opacity="0.5"/>';
    },

    armor: function (id, v) {
        var k = v % 3;
        var head = '<defs>' + rgrad(id + 'b', '#36464C', '#141C1F', 0.5, 0.35) + rgrad(id + 's', '#E6EBEE', '#5F6B72', 0.35, 0.3) + '</defs>' +
            '<rect width="400" height="500" fill="url(#' + id + 'b)"/>';
        if (k === 1) {
            return head +
                '<path d="M100 90 H300 V230 C 300 330, 250 390, 200 420 C 150 390, 100 330, 100 230 Z" fill="#1E4E79" stroke="#C9A24A" stroke-width="10"/>' +
                '<path d="M100 250 L 200 160 L 300 250 L 300 300 L 200 210 L 100 300 Z" fill="#E2BF62"/>' +
                '<circle cx="200" cy="320" r="26" fill="#F7F3EA" opacity="0.9"/><path d="M200 300 v40 M180 320 h40" stroke="#7A1F22" stroke-width="7"/>';
        }
        if (k === 2) {
            return head +
                '<path d="M120 120 C 160 100, 240 100, 280 120 L 300 170 C 290 260, 270 330, 260 380 L 140 380 C 130 330, 110 260, 100 170 Z" fill="url(#' + id + 's)"/>' +
                '<path d="M200 112 V380" stroke="#4A555B" stroke-width="3" opacity="0.6"/>' +
                '<path d="M140 380 H260 L 266 410 H134Z M134 410 H266 L 270 440 H130Z" fill="url(#' + id + 's)" stroke="#3B454A" stroke-width="2"/>' +
                '<path d="M120 120 C 100 130, 80 150, 70 180 L 104 186 Z M280 120 C 300 130, 320 150, 330 180 L 296 186 Z" fill="url(#' + id + 's)"/>' +
                '<path d="M150 150 C 180 170, 220 170, 250 150" stroke="#C9A24A" stroke-width="4" fill="none"/>';
        }
        return head +
            '<path d="M120 300 C 110 200, 140 110, 200 100 C 260 110, 290 200, 280 300 Z" fill="url(#' + id + 's)"/>' +
            '<path d="M200 96 C 206 160, 206 240, 200 300" stroke="#C9A24A" stroke-width="6" fill="none"/>' +
            '<g stroke="#1B2326" stroke-width="5" stroke-linecap="round"><path d="M138 206 H186"/><path d="M214 206 H262"/><path d="M140 222 H186"/><path d="M214 222 H260"/></g>' +
            '<path d="M120 300 C 140 330, 260 330, 280 300 L 290 340 C 260 370, 140 370, 110 340 Z" fill="url(#' + id + 's)" stroke="#3B454A" stroke-width="2"/>' +
            '<path d="M110 340 C 140 370, 260 370, 290 340 L 296 380 C 260 410, 140 410, 104 380 Z" fill="url(#' + id + 's)" stroke="#3B454A" stroke-width="2"/>';
    },

    pottery: function (id, v) {
        var k = v % 3;
        var body = ['#C0643A', '#1E1A16', '#2E8FA8'][k], band = ['#1E1A16', '#C0643A', '#E2BF62'][k];
        var meander = '';
        for (var x = 128; x < 272; x += 24) {
            meander += 'M' + x + ' 300 v-14 h16 v8 h-8';
        }
        return '<defs>' + vgrad(id + 'b', '#EFE8DA', '#D6CCB6') + rgrad(id + 'v', 'rgba(255,255,255,0.35)', 'rgba(0,0,0,0.25)', 0.35, 0.35) + '</defs>' +
            '<rect width="400" height="500" fill="url(#' + id + 'b)"/>' +
            '<ellipse cx="200" cy="452" rx="90" ry="12" fill="#000" opacity="0.12"/>' +
            '<path d="M150 120 C 120 120, 112 170, 140 186" stroke="' + body + '" stroke-width="12" fill="none"/>' +
            '<path d="M250 120 C 280 120, 288 170, 260 186" stroke="' + body + '" stroke-width="12" fill="none"/>' +
            '<path d="M168 90 H232 V150 C 300 170, 320 240, 300 320 C 288 380, 250 420, 226 432 H174 C 150 420, 112 380, 100 320 C 80 240, 100 170, 168 150 Z" fill="' + body + '"/>' +
            '<path d="M160 82 H240 V96 H160Z M172 432 H228 L 236 452 H164Z" fill="' + body + '"/>' +
            '<path d="M108 270 H292 V310 H104 Z" fill="' + band + '"/>' +
            '<path d="' + meander + '" stroke="' + body + '" stroke-width="3" fill="none"/>' +
            '<path d="M110 200 H290" stroke="' + band + '" stroke-width="6"/>' +
            '<path d="M120 360 H280" stroke="' + band + '" stroke-width="4"/>' +
            '<path d="M168 90 H232 V150 C 300 170, 320 240, 300 320 C 288 380, 250 420, 226 432 H174 C 150 420, 112 380, 100 320 C 80 240, 100 170, 168 150 Z" fill="url(#' + id + 'v)"/>';
    },

    carpet: function (id, v) {
        var k = v % 4;
        var field = ['#8E2A2A', '#1E3F66', '#2F5B3E', '#1F3A2E'][k];
        var med = ['#1E3F66', '#8E2A2A', '#C9A24A', '#4E7A4A'][k];
        var dots = '';
        for (var y = 90; y <= 410; y += 40) {
            for (var x = 80; x <= 320; x += 40) {
                dots += '<circle cx="' + x + '" cy="' + y + '" r="4"/>';
            }
        }
        var center = k === 3
            ? '<path d="M200 380 V200" stroke="#5A3E2B" stroke-width="10"/><circle cx="200" cy="190" r="70" fill="#4E7A4A"/><circle cx="160" cy="220" r="40" fill="#3E6B4A"/><circle cx="240" cy="220" r="40" fill="#3E6B4A"/><path d="M110 380 l 14 -26 l 14 26z M260 380 l 14 -26 l 14 26z" fill="#E2BF62"/>'
            : '<path d="M200 130 L 300 250 L 200 370 L 100 250 Z" fill="' + med + '" stroke="#E2BF62" stroke-width="5"/><circle cx="200" cy="250" r="34" fill="#E2BF62"/><circle cx="200" cy="250" r="14" fill="' + field + '"/>';
        return '<defs>' + grain(id) + '</defs>' +
            '<rect width="400" height="500" fill="#D9B45A"/>' +
            '<rect x="22" y="22" width="356" height="456" fill="' + med + '"/>' +
            '<rect x="44" y="44" width="312" height="412" fill="' + field + '"/>' +
            '<g fill="#E2BF62" opacity="0.45">' + dots + '</g>' +
            center +
            '<g fill="#E2BF62" opacity="0.9"><path d="M44 44 h50 L44 94Z M356 44 h-50 L356 94Z M44 456 h50 L44 406Z M356 456 h-50 L356 406Z"/></g>' +
            grainRect(id, 0.18);
    },

    architecture: function (id, v) {
        if (v % 2) {
            return '<defs>' + vgrad(id + 'w', '#3A3A36', '#1C1D1A') + '</defs>' +
                '<rect width="400" height="500" fill="url(#' + id + 'w)"/>' +
                '<path d="M90 470 V190 C 90 120, 150 60, 200 40 C 250 60, 310 120, 310 190 V470Z" fill="#11140F"/>' +
                '<g opacity="0.95">' +
                    '<path d="M108 460 V196 C 108 136, 158 84, 200 64 C 242 84, 292 136, 292 196 V460Z" fill="#1E4E79"/>' +
                    '<path d="M108 300 H292 V360 H108Z" fill="#7A1F22"/><path d="M108 196 C 108 136, 158 84, 200 64 V196Z" fill="#2E86C1"/>' +
                    '<path d="M200 64 C 242 84, 292 136, 292 196 H200Z" fill="#E2BF62"/><path d="M108 400 H292 V460 H108Z" fill="#4E7A4A"/>' +
                    '<circle cx="200" cy="250" r="36" fill="#E2BF62"/><circle cx="200" cy="250" r="20" fill="#7FC8C2"/>' +
                '</g>' +
                '<g stroke="#11140F" stroke-width="6" fill="none"><path d="M200 64 V460 M108 196 H292 M108 300 H292 M108 360 H292 M108 400 H292"/></g>';
        }
        return '<defs>' + vgrad(id + 's', '#7DB9DF', '#EAF2F2') + vgrad(id + 'm', '#FBF8F1', '#D6CEBD') + '</defs>' +
            '<rect width="400" height="500" fill="url(#' + id + 's)"/>' +
            '<path d="M50 160 L 200 80 L 350 160 Z" fill="url(#' + id + 'm)"/><path d="M80 152 L 200 92 L 320 152 Z" fill="#E9E2D2"/>' +
            '<rect x="50" y="160" width="300" height="26" fill="#EDE6D6"/>' +
            '<g fill="url(#' + id + 'm)"><rect x="66" y="190" width="30" height="210"/><rect x="134" y="190" width="30" height="210"/><rect x="202" y="190" width="30" height="210"/><rect x="270" y="190" width="30" height="210"/></g>' +
            '<g stroke="#C9C1AE" stroke-width="2"><path d="M76 192v206M86 192v206M144 192v206M154 192v206M212 192v206M222 192v206M280 192v206M290 192v206"/></g>' +
            '<rect x="40" y="400" width="320" height="22" fill="#E3DCCB"/><rect x="26" y="422" width="348" height="22" fill="#D8D0BE"/>' +
            '<rect y="444" width="400" height="56" fill="#8DAE62"/>';
    },

    egyptian: function (id, v) {
        var stripe = v % 2 ? '#2E8FA8' : '#1E3F66';
        return '<defs>' + rgrad(id + 'b', '#2A3340', '#0F141B', 0.5, 0.35) + rgrad(id + 'g', '#F6D27A', '#A87B22', 0.4, 0.3) + '</defs>' +
            '<rect width="400" height="500" fill="url(#' + id + 'b)"/>' +
            '<path d="M200 70 C 120 70, 90 140, 84 220 L 60 420 H340 L 316 220 C 310 140, 280 70, 200 70Z" fill="url(#' + id + 'g)"/>' +
            '<g stroke="' + stripe + '" stroke-width="12"><path d="M96 180 L 72 400"/><path d="M304 180 L 328 400"/><path d="M112 140 L 92 400"/><path d="M288 140 L 308 400"/></g>' +
            '<ellipse cx="200" cy="240" rx="72" ry="92" fill="url(#' + id + 'g)"/>' +
            '<path d="M150 214 q20 -14 40 0 M210 214 q20 -14 40 0" stroke="#1C2420" stroke-width="7" fill="none"/>' +
            '<path d="M146 230 q24 12 46 0 M208 230 q24 12 46 0" stroke="#1C2420" stroke-width="5" fill="#F7F3EA"/>' +
            '<path d="M196 250 v34 h10" stroke="#8F6E22" stroke-width="4" fill="none"/>' +
            '<path d="M178 306 q22 10 44 0" stroke="#7A1F22" stroke-width="5" fill="none"/>' +
            '<path d="M120 380 C 140 420, 260 420, 280 380 L 300 440 H100 Z" fill="' + stripe + '"/>' +
            '<path d="M110 410 H290 M106 428 H294" stroke="#E2BF62" stroke-width="5"/>' +
            '<path d="M190 60 C 190 40, 210 40, 210 60 L 214 92 H186 Z" fill="' + stripe + '"/>';
    },

    decorative: function (id, v) {
        if (v % 2) {
            var tiles = '';
            for (var r = 0; r < 4; r++) {
                for (var c = 0; c < 3; c++) {
                    var x = 30 + c * 116, y = 20 + r * 116;
                    tiles += '<rect x="' + x + '" y="' + y + '" width="108" height="108" fill="#F7F3EA"/>' +
                        '<path d="M' + (x + 54) + ' ' + (y + 96) + ' C ' + (x + 54) + ' ' + (y + 70) + ', ' + (x + 54) + ' ' + (y + 50) + ', ' + (x + 54) + ' ' + (y + 40) + '" stroke="#4E7A4A" stroke-width="4" fill="none"/>' +
                        '<path d="M' + (x + 40) + ' ' + (y + 40) + ' q14 -30 14 -24 q0 -6 14 24 q-14 10 -28 0z" fill="#B4432F"/>' +
                        '<path d="M' + (x + 54) + ' ' + (y + 74) + ' q-24 -6 -26 -24 q20 4 26 24z M' + (x + 54) + ' ' + (y + 74) + ' q24 -6 26 -24 q-20 4 -26 24z" fill="#4E7A4A"/>' +
                        '<path d="M' + x + ' ' + y + ' h18 a18 18 0 0 1 -18 18z M' + (x + 108) + ' ' + y + ' h-18 a18 18 0 0 0 18 18z M' + x + ' ' + (y + 108) + ' h18 a18 18 0 0 0 -18 -18z M' + (x + 108) + ' ' + (y + 108) + ' h-18 a18 18 0 0 1 18 -18z" fill="#2E86C1"/>';
                }
            }
            return '<defs>' + grain(id) + '</defs><rect width="400" height="500" fill="#1E4E79"/>' + tiles + grainRect(id, 0.12);
        }
        return '<defs>' + vgrad(id + 'b', '#EFE8DA', '#D6CCB6') + rgrad(id + 'p', '#FFFFFF', '#D7DCE0', 0.35, 0.3) + '</defs>' +
            '<rect width="400" height="500" fill="url(#' + id + 'b)"/>' +
            '<ellipse cx="200" cy="456" rx="80" ry="10" fill="#000" opacity="0.12"/>' +
            '<path d="M170 70 H230 V120 C 300 150, 320 250, 290 340 C 270 400, 240 440, 230 450 H170 C 160 440, 130 400, 110 340 C 80 250, 100 150, 170 120 Z" fill="url(#' + id + 'p)"/>' +
            '<path d="M162 62 H238 V76 H162Z" fill="#1E3F66"/>' +
            '<g fill="none" stroke="#1E3F66" stroke-width="5">' +
                '<path d="M120 200 C 150 170, 180 230, 210 200 S 270 170, 284 210"/>' +
                '<path d="M112 300 C 150 270, 190 330, 230 300 S 280 280, 292 300"/>' +
            '</g>' +
            '<g fill="#1E3F66"><circle cx="160" cy="250" r="20"/><circle cx="240" cy="252" r="18"/><circle cx="200" cy="370" r="16"/></g>' +
            '<g fill="#F7F3EA"><circle cx="160" cy="250" r="8"/><circle cx="240" cy="252" r="7"/><circle cx="200" cy="370" r="6"/></g>' +
            '<path d="M130 130 H270 M118 420 H282" stroke="#1E3F66" stroke-width="6"/>';
    }
};

function artSVG(o) {
    var id = 'art' + (++artSeq);
    var fn = ART[o.kind] || ART.landscape;
    return svgOpen(id, o.title) + fn(id, o.v || 0) + '</svg>';
}

/* real photo if present, drawn placeholder otherwise */
function artHTML(o) {
    if (o.image) {
        return '<img src="' + o.image + '" alt="' + o.title.replace(/"/g, '&quot;') + '" loading="lazy">';
    }
    return artSVG(o);
}

/* ── Museum facade beside the forest (Home hero) ── */
function facadeSVG() {
    var cols = '', wins = '', banners = '';
    for (var i = 0; i < 4; i++) {
        var x = 586 + i * 128;
        cols += '<rect x="' + x + '" y="330" width="44" height="300" fill="url(#fcM)"/>' +
            '<rect x="' + (x - 6) + '" y="322" width="56" height="12" fill="#F2ECDF"/><rect x="' + (x - 6) + '" y="626" width="56" height="12" fill="#E6DECC"/>' +
            '<path d="M' + (x + 12) + ' 336 V626 M' + (x + 22) + ' 336 V626 M' + (x + 32) + ' 336 V626" stroke="#CFC6B2" stroke-width="2"/>';
    }
    for (var j = 0; j < 3; j++) {
        var wx = 640 + j * 128;
        wins += '<path d="M' + wx + ' 640 V470 C ' + wx + ' 420, ' + (wx + 74) + ' 420, ' + (wx + 74) + ' 470 V640Z" fill="#1E3A4A"/>' +
            '<path d="M' + wx + ' 640 V470 C ' + wx + ' 420, ' + (wx + 74) + ' 420, ' + (wx + 74) + ' 470 V640Z" fill="url(#fcGlow)" opacity="0.65"/>';
    }
    var bc = ['#7A1F22', '#1E4E79', '#1F3A2E'];
    for (var b = 0; b < 3; b++) {
        var bx = 655 + b * 128;
        banners += '<path d="M' + bx + ' 350 h44 v120 l-22 -14 l-22 14z" fill="' + bc[b] + '"/><path d="M' + (bx + 8) + ' 372 h28" stroke="#E2BF62" stroke-width="3"/>';
    }
    var trees = '';
    var tL = [[40, 520, 150], [140, 480, 170], [250, 510, 140], [340, 470, 160], [440, 520, 120], [1180, 500, 150], [1290, 470, 170], [1400, 510, 150], [1510, 480, 160]];
    tL.forEach(function (t) {
        trees += '<ellipse cx="' + t[0] + '" cy="' + t[1] + '" rx="' + (t[2] * 0.62) + '" ry="' + t[2] + '" fill="#1F3D28"/>' +
            '<ellipse cx="' + (t[0] - 20) + '" cy="' + (t[1] - 30) + '" rx="' + (t[2] * 0.4) + '" ry="' + (t[2] * 0.6) + '" fill="#2F5A38" opacity="0.8"/>';
    });
    return '<svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
        '<defs>' +
            '<linearGradient id="fcSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5FA7D6"/><stop offset="0.55" stop-color="#BFE0EC"/><stop offset="1" stop-color="#F8EBC8"/></linearGradient>' +
            '<linearGradient id="fcM" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#E9E2D2"/><stop offset="0.5" stop-color="#FBF8F1"/><stop offset="1" stop-color="#D6CEBD"/></linearGradient>' +
            '<radialGradient id="fcGlow" cx="0.5" cy="0.8" r="0.8"><stop offset="0" stop-color="#F6C27D"/><stop offset="1" stop-color="#F6C27D" stop-opacity="0"/></radialGradient>' +
            '<radialGradient id="fcSun" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#FFF4C8"/><stop offset="1" stop-color="#FFF4C8" stop-opacity="0"/></radialGradient>' +
        '</defs>' +
        /* layers are grouped so the Home page can move them at different speeds */
        '<g class="px" data-depth="0.5"><rect x="-200" y="-500" width="2000" height="1400" fill="url(#fcSky)"/>' +
        '<circle cx="1260" cy="190" r="220" fill="url(#fcSun)"/></g>' +
        '<g class="px" data-depth="0.42"><g class="clouds"><ellipse cx="380" cy="170" rx="200" ry="34" fill="#fff" opacity="0.45"/><ellipse cx="520" cy="140" rx="120" ry="22" fill="#fff" opacity="0.35"/>' +
        '<ellipse cx="1050" cy="110" rx="150" ry="24" fill="#fff" opacity="0.3"/></g></g>' +
        '<g class="px" data-depth="0.3"><path d="M-200 560 C 200 470, 380 500, 540 470 L 1060 470 C 1220 490, 1400 460, 1800 520 V1000 H-200Z" fill="#2F5A38"/>' +
        trees + '</g>' +
        /* the building */
        '<g class="px" data-depth="0.18">' +
        '<rect x="500" y="300" width="600" height="340" fill="#EDE6D6"/>' +
        '<rect x="380" y="380" width="140" height="260" fill="#E6DECC"/><rect x="1080" y="380" width="140" height="260" fill="#E6DECC"/>' +
        '<path d="M400 640 V470 C 400 440, 440 440, 440 470 V640Z M460 640 V470 C 460 440, 500 440, 500 470 V640Z M1100 640 V470 C 1100 440, 1140 440, 1140 470 V640Z M1160 640 V470 C 1160 440, 1200 440, 1200 470 V640Z" fill="#2B4250"/>' +
        '<rect x="370" y="370" width="160" height="14" fill="#F2ECDF"/><rect x="1070" y="370" width="160" height="14" fill="#F2ECDF"/>' +
        '<rect x="490" y="280" width="620" height="26" fill="#F7F3EA"/><rect x="510" y="240" width="580" height="42" fill="#EDE6D6"/>' +
        '<rect x="490" y="232" width="620" height="12" fill="#F7F3EA"/>' +
        '<text x="800" y="270" text-anchor="middle" font-family="Cinzel, Georgia, serif" font-size="22" letter-spacing="10" fill="#8F6E22">ASHWOOD MUSEUM</text>' +
        wins + cols + banners +
        '<rect x="460" y="636" width="680" height="18" fill="#F2ECDF"/><rect x="430" y="654" width="740" height="18" fill="#E6DECC"/><rect x="400" y="672" width="800" height="20" fill="#D8D0BE"/>' +
        '<path d="M-200 692 H1800 V1100 H-200Z" fill="#3E6B4A"/></g>' +
        '<g class="px" data-depth="0.06"><path d="M-200 760 C 300 720, 600 760, 800 740 S 1300 720, 1800 760 V1100 H-200Z" fill="#1F3D28"/></g>' +
        '</svg>';
}

/* ── Wings and floor plans ── */
var MAP_LAYOUT = {
    1: [
        ['arms',      100,  20, 180, 135],
        ['medieval',  100, 165, 180, 135],
        ['sculpture', 290,  20, 180, 135],
        ['greek',     290, 165, 180, 135],
        ['egypt',     480,  20, 180, 100],
        ['greathall', 480, 130,  180, 70],
        ['shop',      480, 210, 180,  90]
    ],
    2: [
        ['american',  100,  20, 180, 135],
        ['modern',    100, 165, 180, 135],
        ['european',  290,  20, 180, 280],
        ['asian',     480,  20, 180, 135],
        ['islamic',   480, 165, 180, 135]
    ]
};

function floorMapSVG(floor, highlight) {
    var rects = MAP_LAYOUT[floor].map(function (r) {
        var w = WINGS[r[0]];
        var on = r[0] === highlight;
        var cx = r[1] + r[3] / 2, cy = r[2] + r[4] / 2;
        var lines = w.short.split('|');
        var text = lines.map(function (t, i) {
            return '<text x="' + cx + '" y="' + (cy + (i - (lines.length - 1) / 2) * 19 + 5) + '" text-anchor="middle" font-family="Cinzel, Georgia, serif" font-size="15" font-weight="700" letter-spacing="0.3" fill="' + (on ? '#13261D' : '#4F5A53') + '">' + t + '</text>';
        }).join('');
        return '<g class="wing' + (on ? ' on' : '') + '"><rect x="' + r[1] + '" y="' + r[2] + '" width="' + r[3] + '" height="' + r[4] + '" rx="3" fill="' + (on ? '#E2BF62' : '#F7F3EA') + '" stroke="' + (on ? '#8F6E22' : '#CFC6B2') + '" stroke-width="' + (on ? 2 : 1) + '"/>' + text + '</g>';
    }).join('');
    var pin = '';
    if (highlight) {
        var hr = MAP_LAYOUT[floor].filter(function (r) { return r[0] === highlight; })[0];
        if (hr) {
            var px = hr[1] + hr[3] - 22, py = hr[2] + 14;
            pin = '<path d="M' + px + ' ' + (py + 24) + 'c-8-10-12-15-12-21a12 12 0 0 1 24 0c0 6-4 11-12 21z" fill="#7A1F22" stroke="#F7F3EA" stroke-width="1.5"/><circle cx="' + px + '" cy="' + (py + 3) + '" r="4" fill="#F7F3EA"/>';
        }
    }
    var trees = '';
    for (var y = 30; y < 300; y += 34) {
        trees += '<circle cx="' + (30 + (y % 3) * 8) + '" cy="' + y + '" r="16" fill="#4E7A4A" opacity="0.75"/><circle cx="' + (60 - (y % 2) * 6) + '" cy="' + (y + 16) + '" r="13" fill="#3E6B4A" opacity="0.7"/>';
    }
    return '<svg viewBox="0 0 744 320" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Floor ' + floor + ' plan">' +
        '<rect x="0" y="0" width="84" height="320" fill="#DCE6D3"/>' + trees +
        '<text x="42" y="312" text-anchor="middle" font-family="Cinzel, Georgia, serif" font-size="10" letter-spacing="1" fill="#1F3A2E">FOREST</text>' +
        '<rect x="92" y="12" width="576" height="296" rx="4" fill="#EFE8DA" stroke="#B9AE96"/>' +
        rects + pin +
        (floor === 1
            ? '<path d="M668 165 h40 M690 155 l18 10 -18 10" stroke="#1E4E79" stroke-width="2.5" fill="none"/><text x="704" y="196" text-anchor="middle" font-family="Cinzel, Georgia, serif" font-size="10" letter-spacing="1" fill="#1E4E79">ENTRANCE</text>'
            : '') +
        '</svg>';
}

/* ── Small shared icons ── */
var ICON = {
    pin: '<svg viewBox="0 0 12 14" aria-hidden="true"><path d="M6 13.5C2.6 9.6 1 7 1 5a5 5 0 0 1 10 0c0 2-1.6 4.6-5 8.5z" fill="currentColor"/><circle cx="6" cy="5" r="1.8" fill="#F7F3EA"/></svg>',
    laurel: '<svg viewBox="0 0 54 20" aria-hidden="true" fill="currentColor"><path d="M27 18c-6-1-14-5-20-14 4 2 7 3 10 3-2 1-4 1-6 0 3 3 6 5 9 6-3 0-5 0-7-1 4 3 9 5 14 6z"/><path d="M27 18c6-1 14-5 20-14-4 2-7 3-10 3 2 1 4 1 6 0-3 3-6 5-9 6 3 0 5 0 7-1-4 3-9 5-14 6z"/><circle cx="27" cy="3.5" r="2.5"/></svg>',
    mark: '<svg viewBox="0 0 34 44" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M2 43V17C2 9 9 3 17 1c8 2 15 8 15 16v26z"/><path d="M17 41V22"/><path d="M17 30c-4-1-7-4-8-8 4 0 7 2 8 6M17 26c4-1 7-4 8-8-4 0-7 2-8 6M17 22c-3-2-4-5-4-8 3 1 4 4 4 8M17 22c3-2 4-5 4-8-3 1-4 4-4 8"/><path d="M8 43h18"/></svg>',
    arrow: '&rarr;'
};

/* row of pointed Gothic arches that closes dark headers and opens the footer */
function arcadeHTML() {
    return '<div class="arcade" aria-hidden="true"></div>';
}
