/* Sample catalogue for the prototype.
   Every product and brand here is made up. The fields are the ones the data tool will
   fill in later (heat and frost scores, prices, stock, platform, resale and dupes),
   so the live data can replace this file without changing the pages. */
window.HNT = {
    issue: { number: 1, title: "This Week's Heat", date: 'Week of Nov 16' },

    platforms: {
        tiktok:    { name: 'TikTok',    short: 'TT' },
        instagram: { name: 'Instagram', short: 'IG' },
        youtube:   { name: 'YouTube',   short: 'YT' },
        pinterest: { name: 'Pinterest', short: 'PN' },
        x:         { name: 'X',         short: 'X'  },
        reddit:    { name: 'Reddit',    short: 'RD' }
    },

    categories: ['Beauty', 'Tech', 'Fashion', 'Home', 'Fitness', 'Accessories'],

    /* heat: how hot it is right now (0–100). frost: staying power, how long it has trended (0–100).
       retail: store price. resale: typical listed price on resale sites. status: in | low | out */
    products: [
        { id: 'glaze-lip-oil',   name: 'Glaze Drip Lip Oil',      brand: 'Glossé',     cat: 'Beauty',      art: 'bottle',
          platform: 'tiktok',    views: '48.2M', heat: 97, frost: 62, retail: 24,  resale: 41,  status: 'out',
          hue: ['#ff6a3d', '#ff3d8b'], tag: 'Sold out in 3 stores',
          dupes: [ { name: 'Mirror Gloss Oil', brand: 'Lumi Lab', price: 9,  match: 92 },
                   { name: 'Juicy Tint Oil',   brand: 'Pout Co.', price: 12, match: 88 } ] },
        { id: 'orbit-buds',      name: 'Orbit Clear Earbuds',     brand: 'Nova Audio', cat: 'Tech',        art: 'buds',
          platform: 'youtube',   views: '12.7M', heat: 91, frost: 74, retail: 89,  resale: 112, status: 'low',
          hue: ['#29e3ff', '#8b5cff'], tag: 'Restock Friday',
          dupes: [ { name: 'Clearwave Buds',   brand: 'Sonik',    price: 34, match: 85 } ] },
        { id: 'cloud-runner',    name: 'Cloud Runner 2K',         brand: 'Stride',     cat: 'Fashion',     art: 'sneaker',
          platform: 'instagram', views: '9.4M',  heat: 88, frost: 81, retail: 140, resale: 220, status: 'out',
          hue: ['#c0c8d2', '#29e3ff'], tag: 'Resale up 57%',
          dupes: [ { name: 'Float Trainer',    brand: 'Kinetic',  price: 58, match: 86 },
                   { name: 'Puff Sole Runner', brand: 'Urbn Step', price: 64, match: 81 } ] },
        { id: 'big-sip',         name: 'Big Sip 40oz Tumbler',    brand: 'Hydra',      cat: 'Home',        art: 'tumbler',
          platform: 'tiktok',    views: '31.0M', heat: 84, frost: 93, retail: 45,  resale: 70,  status: 'in',
          hue: ['#ff3d8b', '#ffb347'], tag: 'New colour drop',
          dupes: [ { name: 'Gulp 40 Cup',      brand: 'Quench',   price: 19, match: 90 } ] },
        { id: 'halo-shades',     name: 'Halo Shield Shades',      brand: 'Visor',      cat: 'Accessories', art: 'shades',
          platform: 'pinterest', views: '6.1M',  heat: 79, frost: 55, retail: 60,  resale: 72,  status: 'in',
          hue: ['#8b5cff', '#29e3ff'], tag: 'Y2K is back',
          dupes: [ { name: 'Wrap Shield Specs', brand: 'Sunnie',  price: 15, match: 87 } ] },
        { id: 'pixel-cam',       name: 'Pixel Flash Mini Cam',    brand: 'Snapz',      cat: 'Tech',        art: 'camera',
          platform: 'tiktok',    views: '22.3M', heat: 93, frost: 48, retail: 69,  resale: 95,  status: 'low',
          hue: ['#ffb347', '#ff6a3d'], tag: 'Digicam revival',
          dupes: [ { name: 'Retro Snap Cam',   brand: 'Kodo',     price: 29, match: 83 } ] },
        { id: 'claw-clip',       name: 'Chrome Claw Clip Set',    brand: 'Halo Hair',  cat: 'Beauty',      art: 'clip',
          platform: 'instagram', views: '4.8M',  heat: 72, frost: 66, retail: 18,  resale: 22,  status: 'in',
          hue: ['#c0c8d2', '#ff3d8b'], tag: 'Under $20',
          dupes: [ { name: 'Metal Grip Clips', brand: 'Twist',    price: 7,  match: 89 } ] },
        { id: 'glow-mask',       name: 'LED Glow Face Mask',      brand: 'Lumi Lab',   cat: 'Beauty',      art: 'mask',
          platform: 'youtube',   views: '15.9M', heat: 86, frost: 70, retail: 199, resale: 240, status: 'in',
          hue: ['#ff3d8b', '#8b5cff'], tag: 'Dermatologist faves',
          dupes: [ { name: 'Light Therapy Mask', brand: 'Radiant', price: 79, match: 80 } ] },
        { id: 'mist-perfume',    name: 'Velvet Smoke Mist',       brand: 'Maison Nuit', cat: 'Beauty',     art: 'perfume',
          platform: 'tiktok',    views: '27.6M', heat: 89, frost: 77, retail: 38,  resale: 55,  status: 'out',
          hue: ['#8b5cff', '#ff6a3d'], tag: '#ScentTok pick',
          dupes: [ { name: 'Smoked Vanilla Mist', brand: 'Aroma Co.', price: 14, match: 91 } ] },
        { id: 'grip-bands',      name: 'Pulse Resistance Bands',  brand: 'Flexr',      cat: 'Fitness',     art: 'bands',
          platform: 'reddit',    views: '2.2M',  heat: 64, frost: 88, retail: 32,  resale: 34,  status: 'in',
          hue: ['#29e3ff', '#2bff9a'], tag: 'r/homegym approved',
          dupes: [ { name: 'Loop Band Trio',   brand: 'Gymio',    price: 12, match: 84 } ] }
    ]
};
