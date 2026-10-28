/* ══════════════════════════════════════
   ASHWOOD — site data
   Collection entries are placeholders. Each one can take a real photo
   via `image: 'images/collection/<file>.jpg'`.
══════════════════════════════════════ */

var MUSEUM = {
    name: 'Ashwood',
    full: 'Ashwood Museum of Art & History',
    street: '1000 Ashwood Avenue',
    city: 'Ashford, NY 10955',
    phone: '(212) 555-0174',
    email: 'info@ashwoodmuseum.org'
};

/* 0 = Sunday … 6 = Saturday. null = closed. */
var HOURS = [
    { day: 'Sunday',    open: '10:00', close: '17:00' },
    { day: 'Monday',    open: '10:00', close: '17:00' },
    { day: 'Tuesday',   open: '10:00', close: '17:00' },
    { day: 'Wednesday', open: null,    close: null },
    { day: 'Thursday',  open: '10:00', close: '17:00' },
    { day: 'Friday',    open: '10:00', close: '21:00' },
    { day: 'Saturday',  open: '10:00', close: '21:00' }
];

var TICKET_TYPES = [
    { id: 'adult',   label: 'Adult',          note: '',                     price: 30 },
    { id: 'senior',  label: 'Senior',         note: '65 and over',          price: 22 },
    { id: 'student', label: 'Student',        note: 'With valid student ID', price: 17 },
    { id: 'child',   label: 'Child',          note: 'Under 12',             price: 0 },
    { id: 'member',  label: 'Member',         note: 'Show your card on entry', price: 0 }
];

var WINGS = {
    egypt:     { name: 'Egyptian Art',              short: 'Egyptian|Art',          floor: 1, galleries: '100–138' },
    greek:     { name: 'Greek & Roman Art',         short: 'Greek &|Roman Art',     floor: 1, galleries: '150–176' },
    medieval:  { name: 'Medieval Art',              short: 'Medieval|Art',          floor: 1, galleries: '300–307' },
    arms:      { name: 'Arms & Armor',              short: 'Arms &|Armor',          floor: 1, galleries: '370–380' },
    sculpture: { name: 'The Sculpture Court',       short: 'Sculpture|Court',       floor: 1, galleries: '548' },
    greathall: { name: 'The Great Hall',            short: 'Great Hall',            floor: 1, galleries: '' },
    shop:      { name: 'Shop & Café',               short: 'Shop & Café',           floor: 1, galleries: '' },
    european:  { name: 'European Paintings',        short: 'European|Paintings',    floor: 2, galleries: '600–644' },
    asian:     { name: 'Asian Art',                 short: 'Asian Art',             floor: 2, galleries: '200–253' },
    islamic:   { name: 'Islamic Art & Carpets',     short: 'Islamic Art|& Carpets', floor: 2, galleries: '450–464' },
    american:  { name: 'The American Wing',         short: 'American|Wing',         floor: 2, galleries: '700–774' },
    modern:    { name: 'Modern & Contemporary Art', short: 'Modern &|Contemporary', floor: 2, galleries: '900–915' }
};

var ERAS = ['Ancient World', 'Medieval', 'Renaissance', '17th–18th Century', '19th Century', 'Modern'];
var CULTURES = ['Egyptian', 'Greek', 'Roman', 'European', 'Islamic', 'Chinese', 'Japanese', 'American'];
var TYPES = ['Paintings', 'Sculpture', 'Arms & Armor', 'Pottery & Ceramics', 'Textiles & Carpets', 'Architecture', 'Decorative Arts'];

var COLLECTION = [
    /* ── European Paintings ── */
    { id: 'cypresses-above-the-bay', title: 'Cypresses Above the Bay', artist: 'Lucien Arnaud', artistBio: 'French, 1841–1903', date: '1889',
      era: '19th Century', culture: 'European', type: 'Paintings', kind: 'landscape', v: 0, wing: 'european', gallery: 624,
      medium: 'Oil on canvas', dimensions: '28 3/4 × 36 3/4 in. (73 × 93.4 cm)', accession: 'AW.1949.112', credit: 'Bequest of Margaret Holloway, 1949',
      description: 'Painted in a single summer on the southern coast, the canvas sets dark cypresses against a sea that seems to hum with heat. Arnaud worked outdoors, and the brushwork still carries the rush of the afternoon wind.' },
    { id: 'woman-in-a-lace-collar', title: 'Portrait of a Woman in a Lace Collar', artist: 'Pieter van Hal', artistBio: 'Dutch, 1598–1660', date: 'ca. 1632',
      era: '17th–18th Century', culture: 'European', type: 'Paintings', kind: 'portrait', v: 0, wing: 'european', gallery: 632,
      medium: 'Oil on wood', dimensions: '26 × 20 1/2 in. (66 × 52.1 cm)', accession: 'AW.1913.41', credit: 'Gift of the Whitcomb family, 1913',
      description: 'Van Hal lavished as much care on the starched lace as on the sitter’s steady gaze. The portrait is a quiet study in restraint, and in the wealth of Amsterdam’s merchant class.' },
    { id: 'fair-wind-off-the-cyclades', title: 'Fair Wind off the Cyclades', artist: 'Henry Calloway', artistBio: 'British, 1812–1880', date: '1856',
      era: '19th Century', culture: 'European', type: 'Paintings', kind: 'seascape', v: 0, wing: 'european', gallery: 627,
      medium: 'Oil on canvas', dimensions: '30 × 42 in. (76.2 × 106.7 cm)', accession: 'AW.1921.8', credit: 'Purchase, Ashwood Fund, 1921',
      description: 'Calloway sailed the Aegean twice and painted it for the rest of his life. A single caïque leans into a bright wind, its sails the whitest note on the canvas.', exhibition: 'light-on-the-aegean' },
    { id: 'still-life-with-oranges', title: 'Still Life with Oranges and a Pewter Jug', artist: 'Anna de Vries', artistBio: 'Dutch, 1608–1671', date: 'ca. 1650',
      era: '17th–18th Century', culture: 'European', type: 'Paintings', kind: 'stilllife', v: 0, wing: 'european', gallery: 638,
      medium: 'Oil on canvas', dimensions: '23 1/2 × 29 in. (59.7 × 73.7 cm)', accession: 'AW.1962.204', credit: 'Gift of Eleanor and James Pryce, 1962',
      description: 'Out of a dark ground, de Vries pulls the glow of citrus and the dull shine of pewter. Every surface is described with a different touch of the brush.' },
    { id: 'evening-on-the-ashwood-pond', title: 'Evening on the Ashwood Pond', artist: 'Camille Roux', artistBio: 'French, 1838–1912', date: '1874',
      era: '19th Century', culture: 'European', type: 'Paintings', kind: 'landscape', v: 1, wing: 'european', gallery: 625,
      medium: 'Oil on canvas', dimensions: '25 1/2 × 32 in. (64.8 × 81.3 cm)', accession: 'AW.1930.17', credit: 'Bequest of Charles Lyman, 1930',
      description: 'Roux visited the museum’s neighboring forest in 1873 and painted the pond at dusk, when the light turns copper. The museum acquired it, fittingly, the year its north galleries opened onto the trees.', exhibition: 'painters-of-the-open-air' },
    { id: 'young-man-in-a-red-doublet', title: 'Young Man in a Red Doublet', artist: 'Giovanni Ferro', artistBio: 'Italian, 1480–1531', date: 'ca. 1515',
      era: 'Renaissance', culture: 'European', type: 'Paintings', kind: 'portrait', v: 2, wing: 'european', gallery: 609,
      medium: 'Oil on wood', dimensions: '22 × 17 in. (55.9 × 43.2 cm)', accession: 'AW.1908.3', credit: 'Gift of Frederick Ashwood, 1908',
      description: 'A young Florentine looks out with the self-possession of someone who knows he is being remembered. The deep red of his doublet was among the most costly pigments of its day.' },
    { id: 'pastoral-with-shepherds', title: 'Pastoral Landscape with Shepherds', artist: 'Claude Mercier', artistBio: 'French, 1604–1679', date: '1648',
      era: '17th–18th Century', culture: 'European', type: 'Paintings', kind: 'landscape', v: 2, wing: 'european', gallery: 617,
      medium: 'Oil on canvas', dimensions: '38 × 50 in. (96.5 × 127 cm)', accession: 'AW.1955.66', credit: 'Purchase, Ashwood Fund, 1955',
      description: 'Mercier invented an ideal countryside of soft light, distant water and ancient calm. It is a vision that painters would chase for the next two centuries.', exhibition: 'painters-of-the-open-air' },

    /* ── The American Wing ── */
    { id: 'mrs-eleanor-whitcomb', title: 'Portrait of Mrs. Eleanor Whitcomb', artist: 'James Thorne', artistBio: 'American, 1838–1910', date: '1885',
      era: '19th Century', culture: 'American', type: 'Paintings', kind: 'portrait', v: 1, wing: 'american', gallery: 771,
      medium: 'Oil on canvas', dimensions: '50 × 34 in. (127 × 86.4 cm)', accession: 'AW.1916.22', credit: 'Gift of the sitter’s daughter, 1916',
      description: 'Thorne painted the museum’s first woman trustee in deep forest green. It is a confident, modern portrait of a woman who helped build this institution.' },
    { id: 'storm-over-the-sound', title: 'Storm over the Sound', artist: 'Margaret Lowell', artistBio: 'American, 1831–1899', date: '1868',
      era: '19th Century', culture: 'American', type: 'Paintings', kind: 'seascape', v: 1, wing: 'american', gallery: 760,
      medium: 'Oil on canvas', dimensions: '24 × 40 in. (61 × 101.6 cm)', accession: 'AW.1977.9', credit: 'Gift of the Lowell Foundation, 1977',
      description: 'Lowell captures the moment before the weather breaks: the sky bruised, the water still, a single sail racing for harbor.', exhibition: 'painters-of-the-open-air' },

    /* ── Modern & Contemporary ── */
    { id: 'composition-in-aegean-blue', title: 'Composition in Aegean Blue', artist: 'Ines Kovac', artistBio: 'Croatian-American, 1902–1979', date: '1931',
      era: 'Modern', culture: 'European', type: 'Paintings', kind: 'abstract', v: 0, wing: 'modern', gallery: 905,
      medium: 'Oil on canvas', dimensions: '40 × 32 in. (101.6 × 81.3 cm)', accession: 'AW.1985.140', credit: 'Gift of the artist’s estate, 1985',
      description: 'Kovac reduced the harbor of her childhood to a handful of colors: sea, sun, a red roof and the green of the hills. It reads as pure geometry, and as a postcard home.', exhibition: 'modern-forms' },
    { id: 'field-of-ochre-and-moss', title: 'Field of Ochre and Moss', artist: 'Daniel Okoro', artistBio: 'American, 1924–1988', date: '1957',
      era: 'Modern', culture: 'American', type: 'Paintings', kind: 'abstract', v: 1, wing: 'modern', gallery: 912,
      medium: 'Oil on canvas', dimensions: '84 × 66 in. (213.4 × 167.6 cm)', accession: 'AW.1990.3', credit: 'Purchase, Contemporary Art Fund, 1990',
      description: 'Two soft-edged bands of color hover in a dark green field. Stand close, as Okoro intended, and the painting fills your vision like a landscape at dusk.', exhibition: 'modern-forms' },

    /* ── Asian Art ── */
    { id: 'vase-with-peony-scrolls', title: 'Vase with Peony Scrolls', artist: '', artistBio: '', date: 'Ming dynasty, Xuande period (1426–35)',
      era: 'Renaissance', culture: 'Chinese', type: 'Pottery & Ceramics', kind: 'decorative', v: 0, wing: 'asian', gallery: 205,
      medium: 'Porcelain painted with cobalt blue under transparent glaze', dimensions: 'H. 17 3/4 in. (45.1 cm)', accession: 'AW.1924.77', credit: 'Bequest of Harriet Lin, 1924',
      description: 'Imperial kilns at Jingdezhen produced this vase. The cobalt, imported across the Silk Road, pools and darkens where the painter’s brush paused.' },
    { id: 'pines-and-mist', title: 'Pines and Mist over the Mountains', artist: 'Attributed to Shen Qiyuan', artistBio: 'Chinese, active late 17th century', date: '1702',
      era: '17th–18th Century', culture: 'Chinese', type: 'Paintings', kind: 'ink', v: 0, wing: 'asian', gallery: 210,
      medium: 'Hanging scroll; ink on paper', dimensions: '52 × 18 in. (132.1 × 45.7 cm)', accession: 'AW.1936.50', credit: 'Gift of Mr. and Mrs. Robert Chen, 1936',
      description: 'Layers of ink wash become mountains, mist and distance. A single pine anchors the foreground: a traditional emblem of endurance.' },
    { id: 'autumn-mountains', title: 'Autumn Mountains', artist: 'Unidentified artist', artistBio: 'Japanese, Edo period', date: 'ca. 1780',
      era: '17th–18th Century', culture: 'Japanese', type: 'Paintings', kind: 'ink', v: 1, wing: 'asian', gallery: 225,
      medium: 'Hanging scroll; ink and light color on paper', dimensions: '44 × 15 in. (111.8 × 38.1 cm)', accession: 'AW.1959.12', credit: 'Purchase, Ashwood Fund, 1959',
      description: 'Painted for a tea room, the scroll was meant to be changed with the season. Its quiet peaks were hung for the first cool weeks of autumn.' },

    /* ── Islamic Art & Carpets ── */
    { id: 'medallion-carpet', title: 'Medallion Carpet', artist: '', artistBio: '', date: 'Second half of the 16th century',
      era: 'Renaissance', culture: 'Islamic', type: 'Textiles & Carpets', kind: 'carpet', v: 0, wing: 'islamic', gallery: 462,
      medium: 'Wool warp, weft and pile', dimensions: '16 ft. 4 in. × 11 ft. 2 in. (497.8 × 340.4 cm)', accession: 'AW.1946.18', credit: 'Gift of Arsen Kalustian, 1946',
      description: 'Woven in Safavid Iran, the carpet unfolds from a central medallion like a garden seen from above. More than two million hand-tied knots hold its pattern.', exhibition: 'threads-of-empire' },
    { id: 'star-ushak-carpet', title: 'Star Ushak Carpet', artist: '', artistBio: '', date: 'Late 16th century',
      era: 'Renaissance', culture: 'Islamic', type: 'Textiles & Carpets', kind: 'carpet', v: 1, wing: 'islamic', gallery: 461,
      medium: 'Wool warp, weft and pile', dimensions: '14 ft. × 7 ft. 6 in. (426.7 × 228.6 cm)', accession: 'AW.1958.73', credit: 'Bequest of Joseph Varner, 1958',
      description: 'Carpets like this one, woven in western Anatolia, were so prized in Europe that painters placed them at the feet of saints and on the tables of kings.', exhibition: 'threads-of-empire' },
    { id: 'panel-of-tulip-tiles', title: 'Panel of Tulip Tiles', artist: '', artistBio: '', date: 'ca. 1575',
      era: 'Renaissance', culture: 'Islamic', type: 'Decorative Arts', kind: 'decorative', v: 1, wing: 'islamic', gallery: 455,
      medium: 'Stonepaste; polychrome painted under transparent glaze', dimensions: '46 × 34 in. (116.8 × 86.4 cm)', accession: 'AW.1902.10', credit: 'Gift of Frederick Ashwood, 1902',
      description: 'From the kilns of Iznik, these tiles once lined an Ottoman pavilion. The raised red, a closely guarded technique, glows like enamel.' },
    { id: 'garden-carpet', title: 'Garden Carpet', artist: '', artistBio: '', date: '17th century',
      era: '17th–18th Century', culture: 'Islamic', type: 'Textiles & Carpets', kind: 'carpet', v: 2, wing: 'islamic', gallery: 463,
      medium: 'Cotton warp and weft; wool pile', dimensions: '12 ft. 9 in. × 6 ft. 2 in. (388.6 × 188 cm)', accession: 'AW.1970.41', credit: 'Purchase, Ashwood Fund, 1970',
      description: 'A paradise garden in wool: channels of water, flowering beds and a central pool, all meant to be walked upon and dreamed over.', exhibition: 'threads-of-empire' },

    /* ── Greek & Roman Art ── */
    { id: 'amphora-with-meander-band', title: 'Terracotta Amphora with Meander Band', artist: 'Attributed to the Ashwood Painter', artistBio: 'Greek, Attic', date: 'ca. 530 B.C.',
      era: 'Ancient World', culture: 'Greek', type: 'Pottery & Ceramics', kind: 'pottery', v: 0, wing: 'greek', gallery: 171,
      medium: 'Terracotta; black-figure', dimensions: 'H. 16 1/8 in. (41 cm)', accession: 'AW.1906.1021', credit: 'Purchase, Ashwood Fund, 1906',
      description: 'Amphorae carried wine and oil across the Mediterranean. This one, made in Athens, was too fine to travel and was likely given as a prize.', exhibition: 'light-on-the-aegean' },
    { id: 'black-glaze-krater', title: 'Black-Glaze Krater', artist: '', artistBio: 'Greek, South Italian', date: 'ca. 350 B.C.',
      era: 'Ancient World', culture: 'Greek', type: 'Pottery & Ceramics', kind: 'pottery', v: 1, wing: 'greek', gallery: 161,
      medium: 'Terracotta', dimensions: 'H. 18 in. (45.7 cm)', accession: 'AW.1911.38', credit: 'Purchase, Ashwood Fund, 1911',
      description: 'Used to mix wine with water at a symposium. The deep, mirror-like glaze was a mark of a master potter’s control of the kiln.', exhibition: 'light-on-the-aegean' },
    { id: 'marble-head-of-a-youth', title: 'Marble Head of a Youth', artist: '', artistBio: 'Roman copy of a Greek original', date: '1st–2nd century A.D.',
      era: 'Ancient World', culture: 'Roman', type: 'Sculpture', kind: 'sculpture', v: 0, wing: 'greek', gallery: 162,
      medium: 'Marble', dimensions: 'H. 14 1/2 in. (36.8 cm)', accession: 'AW.1914.105', credit: 'Holloway Fund, 1914',
      description: 'Roman collectors adored Greek sculpture and commissioned copies like this one. Through them, lost bronze masterpieces survive in marble.', exhibition: 'light-on-the-aegean' },
    { id: 'bust-of-a-philosopher', title: 'Portrait Bust of a Philosopher', artist: '', artistBio: 'Greek, Hellenistic', date: '2nd century B.C.',
      era: 'Ancient World', culture: 'Greek', type: 'Sculpture', kind: 'sculpture', v: 2, wing: 'greek', gallery: 153,
      medium: 'Marble', dimensions: 'H. 19 in. (48.3 cm)', accession: 'AW.1927.4', credit: 'Purchase, Ashwood Fund, 1927',
      description: 'Hellenistic sculptors turned from ideal beauty to real faces: lined, thoughtful and a little tired. A thinker, mid-thought.' },
    { id: 'temple-of-artemis-fragment', title: 'Column and Pediment, Temple of Artemis', artist: '', artistBio: 'Greek', date: 'ca. 300 B.C.',
      era: 'Ancient World', culture: 'Greek', type: 'Architecture', kind: 'architecture', v: 0, wing: 'greek', gallery: 150,
      medium: 'Marble', dimensions: 'H. 39 ft. (11.9 m) as installed', accession: 'AW.1926.200', credit: 'Gift of the Society for Classical Exploration, 1926',
      description: 'Reassembled from more than 140 fragments, the facade rises through two floors of the Greek galleries. Visitors pass beneath it on their way to the Aegean sculpture halls.', exhibition: 'light-on-the-aegean' },
    { id: 'bronze-statuette-of-an-athlete', title: 'Bronze Statuette of a Victorious Athlete', artist: '', artistBio: 'Greek', date: 'ca. 460 B.C.',
      era: 'Ancient World', culture: 'Greek', type: 'Sculpture', kind: 'sculpture', v: 1, wing: 'greek', gallery: 158,
      medium: 'Bronze', dimensions: 'H. 9 3/4 in. (24.8 cm)', accession: 'AW.1918.61', credit: 'Purchase, Ashwood Fund, 1918',
      description: 'Small enough to hold, this victor was dedicated at a sanctuary to give thanks for a win. The patina is the green of old coins and sea air.', exhibition: 'light-on-the-aegean' },

    /* ── Egyptian Art ── */
    { id: 'funerary-mask-of-a-noble', title: 'Funerary Mask of a Noble', artist: '', artistBio: 'Egyptian, New Kingdom', date: 'ca. 1390–1352 B.C.',
      era: 'Ancient World', culture: 'Egyptian', type: 'Sculpture', kind: 'egyptian', v: 0, wing: 'egypt', gallery: 119,
      medium: 'Cartonnage, gilded gesso, glass inlay', dimensions: 'H. 19 3/4 in. (50.2 cm)', accession: 'AW.1920.3.1', credit: 'Ashwood Excavations, 1920',
      description: 'Placed over the face of the deceased, the mask offered an idealized, eternal likeness of gold, the flesh of the gods, and lapis-blue hair.', exhibition: 'gold-of-the-pharaohs' },
    { id: 'coffin-mask-in-faience', title: 'Coffin Mask with Turquoise Stripes', artist: '', artistBio: 'Egyptian, Late Period', date: 'ca. 664–332 B.C.',
      era: 'Ancient World', culture: 'Egyptian', type: 'Sculpture', kind: 'egyptian', v: 1, wing: 'egypt', gallery: 126,
      medium: 'Wood, gesso, paint, gold leaf', dimensions: 'H. 15 in. (38.1 cm)', accession: 'AW.1923.7', credit: 'Purchase, Ashwood Fund, 1923',
      description: 'Turquoise, the color of the Nile’s fertile life, alternates with gold across the headdress, a wish for rebirth made in pigment.', exhibition: 'gold-of-the-pharaohs' },
    { id: 'blue-faience-lotus-chalice', title: 'Blue Faience Lotus Chalice', artist: '', artistBio: 'Egyptian, Third Intermediate Period', date: 'ca. 945–715 B.C.',
      era: 'Ancient World', culture: 'Egyptian', type: 'Pottery & Ceramics', kind: 'pottery', v: 2, wing: 'egypt', gallery: 127,
      medium: 'Faience', dimensions: 'H. 6 1/2 in. (16.5 cm)', accession: 'AW.1926.110', credit: 'Gift of Lucy Ashwood, 1926',
      description: 'Shaped like an opening blue lotus, a flower that closes at night and opens with the sun, the chalice was a symbol of renewal every morning.', exhibition: 'gold-of-the-pharaohs' },

    /* ── Medieval Art ── */
    { id: 'lancet-window-tree-of-life', title: 'Lancet Window with the Tree of Life', artist: '', artistBio: 'French', date: 'ca. 1260',
      era: 'Medieval', culture: 'European', type: 'Architecture', kind: 'architecture', v: 1, wing: 'medieval', gallery: 305,
      medium: 'Pot-metal glass, vitreous paint, lead', dimensions: '11 ft. 8 in. × 4 ft. 6 in. (355.6 × 137.2 cm)', accession: 'AW.1932.80', credit: 'Medieval Art Fund, 1932',
      description: 'Light through this window paints the gallery floor in blue and red each afternoon. Its branching design, the Tree of Life, gives the Gothic Forest exhibition its theme.', exhibition: 'the-gothic-forest' },
    { id: 'gilded-reliquary-bust', title: 'Gilded Reliquary Bust', artist: '', artistBio: 'French, Limoges', date: 'ca. 1220',
      era: 'Medieval', culture: 'European', type: 'Sculpture', kind: 'sculpture', v: 1, wing: 'medieval', gallery: 304,
      medium: 'Copper alloy, gilding, rock crystal', dimensions: 'H. 17 in. (43.2 cm)', accession: 'AW.1917.190', credit: 'Gift of J. P. Thornwell, 1917',
      description: 'Made to hold a relic, the bust once traveled in procession through the forests of the Limousin. Its gilding is worn smooth by centuries of reverent hands.', exhibition: 'the-gothic-forest' },
    { id: 'the-hunt-in-the-wood', title: 'The Hunt in the Wood (Tapestry Fragment)', artist: '', artistBio: 'South Netherlandish', date: 'ca. 1480',
      era: 'Renaissance', culture: 'European', type: 'Textiles & Carpets', kind: 'carpet', v: 3, wing: 'medieval', gallery: 306,
      medium: 'Wool warp; wool, silk and metal-wrapped wefts', dimensions: '10 ft. × 8 ft. 3 in. (304.8 × 251.5 cm)', accession: 'AW.1937.82', credit: 'Gift of Edith Rowe, 1937',
      description: 'A single great tree rises from a meadow of a thousand flowers. Woven for a castle hall, the tapestry brought the forest indoors through the winter.', exhibition: 'the-gothic-forest' },

    /* ── Arms & Armor ── */
    { id: 'close-helmet', title: 'Close Helmet', artist: '', artistBio: 'Italian, Milan', date: 'ca. 1570',
      era: 'Renaissance', culture: 'European', type: 'Arms & Armor', kind: 'armor', v: 0, wing: 'arms', gallery: 371,
      medium: 'Steel, gold', dimensions: 'H. 12 1/2 in. (31.8 cm); Wt. 6 lb. 4 oz. (2.8 kg)', accession: 'AW.1904.4.12', credit: 'Purchase, Ashwood Fund, 1904',
      description: 'Milanese armorers were the most celebrated in Europe. This helmet’s gilded crest marks it as parade armor, made to impress as much as to protect.', exhibition: 'steel-and-ceremony' },
    { id: 'heraldic-pavise', title: 'Heraldic Shield (Pavise)', artist: '', artistBio: 'German', date: 'ca. 1480',
      era: 'Renaissance', culture: 'European', type: 'Arms & Armor', kind: 'armor', v: 1, wing: 'arms', gallery: 374,
      medium: 'Wood, leather, gesso, paint', dimensions: 'H. 43 in. (109.2 cm)', accession: 'AW.1929.150', credit: 'Arms and Armor Fund, 1929',
      description: 'Crossbowmen sheltered behind shields like this while they reloaded. Painted with a town’s arms, it was also a banner carried into the field.', exhibition: 'steel-and-ceremony' },
    { id: 'armor-for-field-and-tournament', title: 'Armor for Field and Tournament', artist: 'Anton Peffenhauser', artistBio: 'German, 1525–1603', date: 'ca. 1560',
      era: 'Renaissance', culture: 'European', type: 'Arms & Armor', kind: 'armor', v: 2, wing: 'arms', gallery: 371,
      medium: 'Steel, gold, leather', dimensions: 'H. 68 in. (172.7 cm); Wt. 54 lb. (24.5 kg)', accession: 'AW.1910.22', credit: 'Gift of Walter Hale, 1910',
      description: 'Built in Augsburg, this armor could be refitted with extra plates for the joust. The gilt etching along its edges is a goldsmith’s signature.', exhibition: 'steel-and-ceremony' },

    /* ── The Sculpture Court ── */
    { id: 'ariadne-asleep', title: 'Ariadne Asleep in the Forest', artist: 'Henri Laurent', artistBio: 'French, 1830–1902', date: '1878',
      era: '19th Century', culture: 'European', type: 'Sculpture', kind: 'sculpture', v: 0, wing: 'sculpture', gallery: 548,
      medium: 'Marble', dimensions: 'H. 41 in. (104.1 cm)', accession: 'AW.1900.12', credit: 'Gift of Frederick Ashwood, 1900',
      description: 'The first work to enter the collection, Ariadne sleeps beneath the Sculpture Court’s skylight, where the trees of the forest outside cast moving shadows across the marble.' },
    { id: 'the-forester', title: 'The Forester', artist: 'Auguste Delmas', artistBio: 'French, 1849–1915', date: '1891',
      era: '19th Century', culture: 'European', type: 'Sculpture', kind: 'sculpture', v: 1, wing: 'sculpture', gallery: 548,
      medium: 'Bronze', dimensions: 'H. 72 in. (182.9 cm)', accession: 'AW.1903.5', credit: 'Gift of the Ashwood Forest Conservancy, 1903',
      description: 'Delmas modeled a woodsman pausing mid-stride, axe lowered, listening. He was cast for the forest gate and moved indoors after a century of weather.', exhibition: 'the-gothic-forest' }
];

var EXHIBITIONS = [
    { id: 'the-gothic-forest', title: 'The Gothic Forest', subtitle: 'Nature in Medieval Art',
      start: '2026-10-02', end: '2027-02-14', wing: 'medieval', galleries: 'Galleries 304–306', cover: 'lancet-window-tree-of-life',
      summary: 'Branching windows, carved vines and woven woods: how medieval makers brought the forest into stone, glass and thread.',
      body: ['To the medieval imagination, the forest was both sanctuary and wilderness, a place of saints and outlaws, of danger and of grace. The great cathedrals were built to echo it: columns rising like trunks, vaults branching overhead and windows glowing like light through leaves.',
             'The Gothic Forest gathers more than sixty works from the collection and from private lenders, from stained glass and reliquaries to tapestries and illuminated manuscripts. It is shown, fittingly, in the galleries that look out onto Ashwood’s own forest.'] },
    { id: 'light-on-the-aegean', title: 'Light on the Aegean', subtitle: 'Greek Art by the Sea',
      start: '2026-06-12', end: '2027-01-10', wing: 'greek', galleries: 'Galleries 150–171', cover: 'amphora-with-meander-band',
      summary: 'Bright marble, black-figure vases and bronze cast in sea air: the art of a civilization that lived facing the water.',
      body: ['Nearly every Greek city stood within a day’s walk of the sea. Light on the Aegean explores how that horizon shaped Greek art: its trade routes and myths, its sculpture weathered by salt wind and its pottery carried in the holds of ships.',
             'The exhibition opens beneath the reassembled facade of the Temple of Artemis and closes with Henry Calloway’s luminous views of the Cyclades, painted two thousand years later.'] },
    { id: 'steel-and-ceremony', title: 'Steel & Ceremony', subtitle: 'Arms of the Renaissance',
      start: '2026-09-01', end: '2027-03-28', wing: 'arms', galleries: 'Galleries 370–374', cover: 'close-helmet',
      summary: 'Parade armor, painted shields and gilded helmets made to dazzle a crowd as much as to survive a battle.',
      body: ['By the sixteenth century, armor had become an art form in its own right. The finest workshops of Milan, Augsburg and Nuremberg competed to produce suits that were masterpieces of engineering and ornament.',
             'Steel & Ceremony brings together forty suits and pieces of armor, many shown for the first time since conservation, alongside the paintings and prints that show how they were worn.'] },
    { id: 'threads-of-empire', title: 'Threads of Empire', subtitle: 'Carpets from Persia to Anatolia',
      start: '2027-03-06', end: '2027-08-01', wing: 'islamic', galleries: 'Galleries 458–464', cover: 'medallion-carpet',
      summary: 'Gardens of wool and silk from the great courts of the Safavid, Ottoman and Mughal empires.',
      body: ['Carpets were among the most valued objects of the early modern world, traded across continents and given as gifts between emperors.',
             'Threads of Empire unrolls more than thirty masterpieces from the collection, several too large to be shown in decades, in a specially built gallery with a raised viewing walk.'] },
    { id: 'painters-of-the-open-air', title: 'Painters of the Open Air', subtitle: 'Landscape from Mercier to the Impressionists',
      start: '2027-04-17', end: '2027-09-12', wing: 'european', galleries: 'Galleries 615–627', cover: 'cypresses-above-the-bay',
      summary: 'Three centuries of artists who carried their easels outdoors to paint the light as it really fell.',
      body: ['From the idealized countryside of the seventeenth century to the sun-struck canvases of the nineteenth, this exhibition follows painters out of the studio and into the fields, the coast and the forest.',
             'It includes Camille Roux’s Evening on the Ashwood Pond, painted a short walk from the museum’s north doors.'] },
    { id: 'gold-of-the-pharaohs', title: 'Gold of the Pharaohs', subtitle: 'Treasures of the New Kingdom',
      start: '2025-11-08', end: '2026-05-17', wing: 'egypt', galleries: 'Galleries 119–127', cover: 'funerary-mask-of-a-noble',
      summary: 'Masks, jewelry and faience from the age of Egypt’s greatest builders.',
      body: ['Gold of the Pharaohs presented the finest objects from Ashwood’s own excavations of the 1920s, alongside loans from collections around the world.'] },
    { id: 'modern-forms', title: 'Modern Forms', subtitle: 'Abstraction, 1910–1960',
      start: '2025-04-04', end: '2025-09-21', wing: 'modern', galleries: 'Galleries 905–912', cover: 'composition-in-aegean-blue',
      summary: 'Fifty years of artists who stripped painting back to color, shape and feeling.',
      body: ['Modern Forms traced the rise of abstraction from its first experiments to the vast color-field canvases of the postwar years.'] }
];

var EVENT_TYPES = ['Talks', 'Tours', 'Concerts', 'Family', 'Workshops'];

var EVENTS = [
    { id: 'e1',  title: 'Curator’s Walk: The Gothic Forest', type: 'Tours', date: '2026-10-16', time: '11:00 AM', length: '60 min', place: 'Gallery 305', price: 'Free with admission',
      desc: 'Join the exhibition’s curator for a walk through the forest of stone, glass and thread.' },
    { id: 'e2',  title: 'Friday Nights: Strings in the Great Hall', type: 'Concerts', date: '2026-10-16', time: '7:00 PM', length: '90 min', place: 'The Great Hall', price: 'Free with admission',
      desc: 'A string quartet plays Debussy and Ravel beneath the Great Hall’s domes as the galleries stay open late.' },
    { id: 'e3',  title: 'Little Explorers: Animals in Armor', type: 'Family', date: '2026-10-18', time: '10:30 AM', length: '45 min', place: 'Gallery 371', price: 'Free',
      desc: 'Ages 4–8. Find the lions, dragons and eagles hiding on the armor, then design your own shield.' },
    { id: 'e4',  title: 'Lecture: Why the Greeks Faced the Sea', type: 'Talks', date: '2026-10-22', time: '6:30 PM', length: '75 min', place: 'Ashwood Auditorium', price: '$25 · Members $15',
      desc: 'A historian of the ancient Mediterranean on trade, myth and the light of the Aegean.' },
    { id: 'e5',  title: 'Sketching in the Sculpture Court', type: 'Workshops', date: '2026-10-24', time: '2:00 PM', length: '2 hrs', place: 'The Sculpture Court', price: '$35 · Materials included',
      desc: 'An artist-led drawing session among the marble and bronze. All levels welcome.' },
    { id: 'e6',  title: 'Highlights of the Collection', type: 'Tours', date: '2026-10-25', time: '1:00 PM', length: '60 min', place: 'Meet in the Great Hall', price: 'Free with admission',
      desc: 'Five thousand years in one hour: a guided tour of the museum’s most beloved works.' },
    { id: 'e7',  title: 'Candlelight Choir: Music for the Forest', type: 'Concerts', date: '2026-10-30', time: '8:00 PM', length: '60 min', place: 'Gallery 305', price: '$40 · Members $30',
      desc: 'Medieval chant and early polyphony sung beneath the Tree of Life window by candlelight.' },
    { id: 'e8',  title: 'Workshop: Weaving Patterns of Persia', type: 'Workshops', date: '2026-11-07', time: '11:00 AM', length: '3 hrs', place: 'Education Studio', price: '$60 · Materials included',
      desc: 'Learn the knots and motifs behind the great Safavid carpets on a small hand loom.' },
    { id: 'e9',  title: 'Family Day: Mummies & Mysteries', type: 'Family', date: '2026-11-14', time: '10:00 AM', length: 'All day', place: 'Egyptian Art', price: 'Free with admission',
      desc: 'Hieroglyph stations, storytelling and a scavenger hunt through the Egyptian galleries.' },
    { id: 'e10', title: 'Conversation: Painting the Open Air', type: 'Talks', date: '2026-11-19', time: '6:30 PM', length: '60 min', place: 'Ashwood Auditorium', price: '$25 · Members $15',
      desc: 'Two painters discuss working outdoors, from Mercier’s Rome to the forest next door.' },
    { id: 'e11', title: 'Winter Solstice Concert', type: 'Concerts', date: '2026-12-19', time: '7:30 PM', length: '90 min', place: 'The Great Hall', price: '$45 · Members $35',
      desc: 'Music for the longest night: choir, brass and organ in the Great Hall.' },
    { id: 'e12', title: 'Morning Tour for Members', type: 'Tours', date: '2026-12-05', time: '9:00 AM', length: '60 min', place: 'Meet in the Great Hall', price: 'Members only',
      desc: 'See the galleries before the doors open, with a curator as your guide.' }
];

var MEMBERSHIPS = [
    { id: 'individual', name: 'Individual', price: 110, perks: ['Free admission for one, all year', 'Members-only exhibition previews', '10% off in the Shop & Café', 'Ashwood Magazine, four times a year'] },
    { id: 'dual', name: 'Dual', price: 200, featured: true, perks: ['Free admission for two named members', 'Everything in Individual', 'Two guest passes each year', 'Members’ morning tours'] },
    { id: 'family', name: 'Family', price: 260, perks: ['Two adults and all children under 18', 'Everything in Dual', 'Priority booking for Family Days', 'Four guest passes each year'] },
    { id: 'patron', name: 'Patron', price: 750, perks: ['Everything in Family', 'Private curator-led evening each season', 'Reserved seating for talks and concerts', 'Invitation to the Patron’s Forest Garden reception'] }
];

/* ── Helpers ── */
function findArt(id) { return COLLECTION.filter(function (o) { return o.id === id; })[0]; }
function findExhibition(id) { return EXHIBITIONS.filter(function (e) { return e.id === id; })[0]; }

function parseDate(s) { var p = s.split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); }
function todayDate() { var d = new Date(); return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }

var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
var MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
var DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function fmtDate(d, withYear) { return MONTHS[d.getMonth()] + ' ' + d.getDate() + (withYear === false ? '' : ', ' + d.getFullYear()); }
function fmtRange(a, b) {
    var s = parseDate(a), e = parseDate(b);
    if (s.getFullYear() === e.getFullYear()) return MONTHS[s.getMonth()] + ' ' + s.getDate() + ' – ' + fmtDate(e);
    return fmtDate(s) + ' – ' + fmtDate(e);
}
function exStatus(ex) {
    var t = todayDate();
    if (parseDate(ex.end) < t) return 'past';
    if (parseDate(ex.start) > t) return 'upcoming';
    return 'current';
}
function fmtTime(hhmm) {
    var p = hhmm.split(':'), h = +p[0], m = p[1];
    var ap = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return h + (m === '00' ? '' : ':' + m) + ' ' + ap;
}
function hoursLabel(dayIndex) {
    var h = HOURS[dayIndex];
    return h.open ? fmtTime(h.open) + ' – ' + fmtTime(h.close) : 'Closed';
}
function locationLabel(o) {
    var w = WINGS[o.wing];
    return 'Gallery ' + o.gallery + ' · Floor ' + w.floor;
}
function money(n) { return '$' + n.toFixed(2).replace(/\.00$/, ''); }
