/* Placeholder listings — swap in real properties and photo paths later.
   Set `photos: ['images/123-main.jpg', ...]` on a listing and the site
   uses those instead of the illustrated placeholder. */
var LISTINGS = [
    {
        id: 'maple-grove-cottage',
        title: 'Sunlit Craftsman Cottage',
        address: '418 Willow Lane',
        city: 'Maple Grove',
        type: 'House',
        status: 'New Listing',
        price: 465000,
        beds: 3, baths: 2, sqft: 1840,
        featured: true,
        scene: { sky: '#8FD3F7', house: '#FFFFFF', roof: '#2E9E5B', sun: 'left', kind: 'house' },
        description: 'A bright craftsman on a quiet, tree-lined street. Morning light pours through the front windows, the kitchen opens onto a deck that overlooks a fenced backyard, and the park is a two-minute walk away.',
        features: ['Open-concept kitchen', 'Back deck & fenced yard', 'Hardwood floors', 'Two-car garage', 'Walk to park & schools']
    },
    {
        id: 'lakeview-modern',
        title: 'Lakeview Modern Retreat',
        address: '22 Shoreline Drive',
        city: 'Lakeview',
        type: 'House',
        status: 'For Sale',
        price: 789000,
        beds: 4, baths: 3, sqft: 2960,
        featured: true,
        scene: { sky: '#6EC6F2', house: '#F4F1EA', roof: '#1B6FA8', sun: 'right', kind: 'house' },
        description: 'Floor-to-ceiling windows frame the water from nearly every room. A modern layout built for gathering, with a primary suite that opens onto a private balcony.',
        features: ['Lake views', 'Primary suite with balcony', 'Chef’s kitchen', 'Home office', 'Private dock access']
    },
    {
        id: 'cedar-park-townhome',
        title: 'Cedar Park Townhome',
        address: '9 Birchwood Court, Unit B',
        city: 'Cedar Park',
        type: 'Townhouse',
        status: 'For Sale',
        price: 349000,
        beds: 2, baths: 2, sqft: 1320,
        featured: true,
        scene: { sky: '#A3DDF9', house: '#FFF4D6', roof: '#E0A72A', sun: 'left', kind: 'townhouse' },
        description: 'An easy-living end unit with a sunny patio, updated finishes, and low-maintenance everything. A great first home close to shops and the greenway trail.',
        features: ['End unit', 'Private patio', 'Updated bathrooms', 'In-unit laundry', 'Steps from greenway']
    },
    {
        id: 'brookside-family',
        title: 'Brookside Family Home',
        address: '1207 Meadow Run',
        city: 'Brookside',
        type: 'House',
        status: 'For Sale',
        price: 552000,
        beds: 4, baths: 2.5, sqft: 2410,
        featured: true,
        scene: { sky: '#7CCBF5', house: '#E8F4FB', roof: '#23874E', sun: 'right', kind: 'house' },
        description: 'Room for everyone, with a large backyard that backs onto open meadow. Updated kitchen, finished basement, and a cul-de-sac that’s perfect for bikes.',
        features: ['Cul-de-sac lot', 'Finished basement', 'Updated kitchen', 'Large backyard', 'Mudroom']
    },
    {
        id: 'sunset-hills-condo',
        title: 'Sunset Hills Corner Condo',
        address: '300 Skyline Ave, #804',
        city: 'Sunset Hills',
        type: 'Condo',
        status: 'New Listing',
        price: 298000,
        beds: 1, baths: 1, sqft: 860,
        featured: true,
        scene: { sky: '#9BD8F8', house: '#FFFFFF', roof: '#2D9CDB', sun: 'right', kind: 'condo' },
        description: 'A high-floor corner unit with wraparound windows and sunset views. Building amenities include a rooftop garden and fitness room.',
        features: ['Corner unit', 'Rooftop garden', 'Fitness room', 'Secure parking', 'Pet friendly']
    },
    {
        id: 'maple-grove-farmhouse',
        title: 'Maple Grove Farmhouse',
        address: '75 Orchard Road',
        city: 'Maple Grove',
        type: 'House',
        status: 'For Sale',
        price: 615000,
        beds: 4, baths: 3, sqft: 2780,
        featured: true,
        scene: { sky: '#86D0F6', house: '#FFFFFF', roof: '#3A4A57', sun: 'left', kind: 'house' },
        description: 'Modern farmhouse charm on a half-acre lot with mature trees. Wide front porch, vaulted living room, and a garden ready for spring.',
        features: ['Half-acre lot', 'Wraparound porch', 'Vaulted ceilings', 'Garden beds', 'Three-car garage']
    },
    {
        id: 'lakeview-townhome',
        title: 'Lakeview Garden Townhome',
        address: '41 Reed Street',
        city: 'Lakeview',
        type: 'Townhouse',
        status: 'For Sale',
        price: 412000,
        beds: 3, baths: 2.5, sqft: 1690,
        featured: false,
        scene: { sky: '#A8E0FA', house: '#EAF7EF', roof: '#2E9E5B', sun: 'right', kind: 'townhouse' },
        description: 'Three levels of bright living space with a private garden and a short walk to the lakefront trail.',
        features: ['Private garden', 'Attached garage', 'Walk to lake', 'Open main floor', 'Storage loft']
    },
    {
        id: 'cedar-park-condo',
        title: 'Cedar Park Loft Condo',
        address: '18 Mill Street, #3C',
        city: 'Cedar Park',
        type: 'Condo',
        status: 'For Sale',
        price: 259000,
        beds: 1, baths: 1, sqft: 780,
        featured: false,
        scene: { sky: '#90D5F7', house: '#FFF8E7', roof: '#E0A72A', sun: 'left', kind: 'condo' },
        description: 'Loft-style living with high ceilings and big windows in a converted mill building, right in the middle of downtown.',
        features: ['High ceilings', 'Exposed brick', 'Downtown location', 'Bike storage', 'Low HOA']
    },
    {
        id: 'brookside-ranch',
        title: 'Brookside Single-Level Ranch',
        address: '64 Clover Lane',
        city: 'Brookside',
        type: 'House',
        status: 'For Sale',
        price: 438000,
        beds: 3, baths: 2, sqft: 1760,
        featured: false,
        scene: { sky: '#7FCCF4', house: '#FFF4D6', roof: '#1B6FA8', sun: 'left', kind: 'house' },
        description: 'Everything on one level, with a sunroom that opens onto a landscaped backyard. Freshly painted and move-in ready.',
        features: ['Single level', 'Sunroom', 'Landscaped yard', 'New roof', 'Move-in ready']
    }
];

function formatPrice(n) {
    return '$' + n.toLocaleString('en-US');
}

function findListing(id) {
    for (var i = 0; i < LISTINGS.length; i++) {
        if (LISTINGS[i].id === id) return LISTINGS[i];
    }
    return null;
}

/* Illustrated placeholder: sky, sun, hills, and a house/condo/townhouse.
   `shift` nudges the palette so gallery thumbnails don't look identical. */
var sceneCount = 0;
function sceneSVG(s, shift) {
    shift = shift || 0;
    var gid = 'sky' + (sceneCount++);
    var sunX = s.sun === 'left' ? 90 : 310;
    sunX += shift * 40;
    var building = '';

    if (s.kind === 'condo') {
        building =
            '<rect x="150" y="70" width="100" height="160" rx="3" fill="' + s.house + '"/>' +
            '<rect x="150" y="62" width="100" height="10" rx="2" fill="' + s.roof + '"/>' +
            windowsGrid(162, 84, 4, 6, 16, 18, 22, 22);
    } else if (s.kind === 'townhouse') {
        building =
            townUnit(110, s.house, s.roof) +
            townUnit(170, s.house, s.roof) +
            townUnit(230, s.house, s.roof);
    } else {
        building =
            '<rect x="130" y="130" width="140" height="100" fill="' + s.house + '"/>' +
            '<polygon points="118,134 200,78 282,134" fill="' + s.roof + '"/>' +
            '<rect x="186" y="180" width="28" height="50" rx="2" fill="#2D9CDB" opacity="0.85"/>' +
            '<rect x="146" y="152" width="28" height="24" rx="2" fill="#BFE6FA"/>' +
            '<rect x="226" y="152" width="28" height="24" rx="2" fill="#BFE6FA"/>' +
            '<rect x="242" y="92" width="14" height="30" fill="' + s.roof + '"/>';
    }

    return '' +
        '<svg viewBox="0 0 400 260" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
            '<defs><linearGradient id="' + gid + '" x1="0" y1="0" x2="0" y2="1">' +
                '<stop offset="0" stop-color="' + s.sky + '"/>' +
                '<stop offset="1" stop-color="#F2FAFF"/>' +
            '</linearGradient></defs>' +
            '<rect width="400" height="260" fill="url(#' + gid + ')"/>' +
            '<circle cx="' + sunX + '" cy="58" r="30" fill="#FFD95A"/>' +
            '<circle cx="' + sunX + '" cy="58" r="44" fill="#FFD95A" opacity="0.25"/>' +
            '<ellipse cx="80" cy="250" rx="220" ry="60" fill="#7BCF8E"/>' +
            '<ellipse cx="340" cy="255" rx="200" ry="55" fill="#5FBF77"/>' +
            building +
            '<rect x="0" y="228" width="400" height="32" fill="#4FB36A"/>' +
            '<circle cx="66" cy="206" r="22" fill="#3FA65C"/><rect x="63" y="214" width="6" height="18" fill="#8A6A45"/>' +
            '<circle cx="338" cy="210" r="18" fill="#3FA65C"/><rect x="335" y="216" width="6" height="16" fill="#8A6A45"/>' +
        '</svg>';
}

function windowsGrid(x0, y0, cols, rows, w, h, dx, dy) {
    var out = '';
    for (var r = 0; r < rows; r++) {
        for (var c = 0; c < cols; c++) {
            out += '<rect x="' + (x0 + c * dx) + '" y="' + (y0 + r * dy) + '" width="' + w + '" height="' + h + '" rx="1.5" fill="#BFE6FA"/>';
        }
    }
    return out;
}

function townUnit(x, wall, roof) {
    return '' +
        '<rect x="' + (x - 28) + '" y="138" width="56" height="92" fill="' + wall + '" stroke="#DCE8EE" stroke-width="1"/>' +
        '<polygon points="' + (x - 32) + ',140 ' + x + ',104 ' + (x + 32) + ',140" fill="' + roof + '"/>' +
        '<rect x="' + (x - 10) + '" y="196" width="20" height="34" rx="2" fill="#2D9CDB" opacity="0.85"/>' +
        '<rect x="' + (x - 18) + '" y="154" width="14" height="16" rx="1.5" fill="#BFE6FA"/>' +
        '<rect x="' + (x + 4) + '" y="154" width="14" height="16" rx="1.5" fill="#BFE6FA"/>';
}

function photoHTML(listing, index) {
    index = index || 0;
    if (listing.photos && listing.photos[index]) {
        return '<img src="' + listing.photos[index] + '" alt="' + listing.title + '">';
    }
    return sceneSVG(listing.scene, index);
}
