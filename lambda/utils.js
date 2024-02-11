/**
 * Checks if a character is a letter or not.
 * @param {string} c character to check
 * @returns a boolean value indicating whether the input character is a letter or not.
 */
function isLetter(c) {
    return c.toLowerCase() !== c.toUpperCase();
}

/**
 * Adds a leading zero to a number if it is less than 10 and returns it as string.
 * @param {number} n number to pad, must be >= 0
 * @returns number as string, padded with a leading zero if the value is less than 10.
 */
function pad(n) {
    return n < 10 ? '0' + n : n.toString();
}

/**
 * Normalize station name based on water, and an optional flag to add a variant to the name.
 * @param {string} name name of station
 * @param {string} water name of water of station
 * @param {boolean} [addVariantToName=false] should station's variant be added to the name returned?
 * @returns Object containing normalized name and variant of station.
 */
export function normalizeStation(name, water, addVariantToName = false) {
    // AwK => '' (remove leading Achterwehrer Schifffahrtskanal)
    // Bhv => Bremerhaven
    // Buessau => Büssau
    // Eisenhüttenstadt Schl. => Schleuse
    // Frankfurt1 (oder) => Frankfurt (Oder)
    // Fuerstenwalde => Fürstenwalde
    // Giessen => Gießen
    // Grafenbrueck => Grafenbrück
    // Gross => Groß
    // Gueritz => Güritz
    // Hann. Münden => Hannoversch Münden
    // Hann. => Hannover
    // Hoerstel => Hörstel
    // Huntebrueck => Huntebrück
    // Kalliss => Kaliß (typo in WSV data)
    // Leesenbreuck => Leesenbrück
    // Lt => Leuchtturm
    // Luebbecke => Lübbecke
    // Lueneburg => Lüneburg
    // Malliss => Malliß
    // Meissen => Meißen
    // Nienbruegge => Nienbrügge
    // Nok => '' (removing leading Nord-Ostsee-Kanal)
    // Osloss => Osloß
    // Ploetzensee => Plötzensee
    // Ragoese => Ragöse
    // Reithoerne => Reithörne
    // Rosslau => Roßlau
    // Ruehen => Rühen
    // Schl. => Schleuse
    // Schloss => Schloß
    // Schmoeckwitz => Schmöckwitz
    // Schoepfurth => Schöpfurth
    // Shw => Schiffshebewerk
    // St. => Sankt
    // Strasse => Straße
    // strohplao => Strohauser Plate Ost
    // Suelfeld => Sülfeld
    // Truebengraben => Trübengraben
    // Whv => Wilhelmshaven
    name = name
        .toLowerCase()
        .replace('aussen', 'außen')
        .replace('awk ', '')
        .replace('bhv ', 'bremerhaven ')
        .replace('buessau', 'büssau')
        .replace('eisenhuettenstadt', 'eisenhüttenstadt')
        .replace('frankfurt1', 'frankfurt')
        .replace('fuerstenwalde', 'fürstenwalde')
        .replace('giessen', 'gießen')
        .replace('grafenbrueck', 'grafenbrück')
        .replace('gross', 'groß')
        .replace('gueritz', 'güritz')
        .replace('hann.muenden', 'hannoversch münden')
        .replace('hann.', 'hannover ')
        .replace('hoerstel', 'hörstel')
        .replace('huntebrueck', 'huntebrück')
        .replace('kalliss', 'kaliß')
        .replace('leesenbrueck', 'leesenbrück')
        .replace('lt ', 'leuchtturm ')
        .replace('luebbecke', 'lübbecke')
        .replace('lueneburg', 'lüneburg')
        .replace('malliss', 'malliß')
        .replace('meissen', 'meißen')
        .replace('nienbruegge', 'nienbrügge')
        .replace('nok ', '')
        .replace('osloss', 'osloß')
        .replace('ploetzensee', 'plötzensee')
        .replace('ragoese', 'ragöse')
        .replace('reithoerne', 'reithörne')
        .replace('rosslau', 'roßlau')
        .replace('ruehen', 'rühen')
        .replace('schl.', 'schleuse')
        .replace('schloss', 'schloß')
        .replace('schmoeckwitz', 'schmöckwitz')
        .replace('schoepfurth', 'schöpfurth')
        .replace('shw ', 'schiffshebewerk ')
        .replace('st.', 'sankt ')
        .replace('strasse', 'straße')
        .replace('strohplao', 'strohauser plate ost')
        .replace('suelfeld', 'sülfeld')
        .replace('truebengraben', 'trübengraben')
        .replace('whv ', 'wilhelmshaven ');

    // replace hyphens, underscores and slashes by spaces as Alexa won't add them to slot values
    // replace multiple spaces by one and remove trailing space
    name = name.replace('-', ' ').replace('_', ' ').replace('/', ' ').replace(/ +/g, ' ').trim();

    // Give unique, meaningful names to non-unique stations
    const calbe = /^calbe( [a-z]{2})/;
    const doemitz = /^d(ö|oe)mitz( [a-z]{2})?/;
    const rothenburg = /^rothenburg( [a-z]{2})/;
    if (name === 'artlenburg' || name === 'artlenburg elk') {
        name = 'artlenburg (' + normalizeWater(water) + ')';
    } else if (name === 'brunsbüttel') {
        name = 'brunsbüttel (' + normalizeWater(water) + ')';
    } else if (name === 'brunsbüttel mole 1') {
        name = 'brunsbüttel mole eins';
    } else if (name === 'calbe grizehne') {
        name = 'calbe-Grizehne';
    } else if (name.match(calbe)) {
        const result = calbe.exec(name);
        name = 'calbe (' + normalizeWater(water) + ')' + result[1];
    } else if (name.match(doemitz)) {
        const result = doemitz.exec(name);
        name = 'dömitz (' + normalizeWater(water) + ')' + (result[2] || '');
    } else if (name === 'eisenhüttenstadt') {
        name = 'eisenhüttenstadt (' + normalizeWater(water) + ')';
    } else if (name === 'elsfleth' || name === 'elsfleth ohrt') {
        name = 'elsfleth (' + normalizeWater(water) + ')';
    } else if (name === 'geesthacht') {
        name = 'geesthacht (' + normalizeWater(water) + ')';
    } else if (name === 'ilmenau') {
        name = 'ilmenau an der ' + normalizeWater(water);
    } else if (name === 'koblenz' || name === 'koblenz up') {
        name = 'koblenz (' + normalizeWater(water) + ')';
    } else if (name === 'konstanz' || name === 'konstanz rhein') {
        name = 'konstanz (' + normalizeWater(water) + ')';
    } else if (name === 'mannheim' || name === 'mannheim neckar') {
        name = 'mannheim (' + normalizeWater(water) + ')';
    } else if (name === 'neustadt') {
        name = 'neustadt (' + normalizeWater(water) + ')';
    } else if (name === 'neustadt glewe op') {
        name = 'neustadt-Glewe op';
    } else if (name === 'neuwied stadt') {
        name = 'neuwied';
    } else if (name === 'nienburg') {
        name = 'nienburg (' + normalizeWater(water) + ')';
    } else if (name === 'rotenburg') {
        name = 'rotenburg an der ' + normalizeWater(water);
    } else if (name.match(rothenburg)) {
        const result = rothenburg.exec(name);
        name = 'rothenburg (' + normalizeWater(water) + ')' + result[1];
    } else if (name === 'waren') {
        name = 'waren (müritz)';
    }

    let variant;
    // OW/UW/OP/UP ...
    if (name.endsWith(' ow')) {
        name = name.replace(' ow', '');
        variant = 'Oberwasser';
    } else if (name.endsWith(' oberwasser')) {
        name = name.replace(' oberwasser', '');
        variant = 'Oberwasser';
    } else if (name.endsWith(' uw')) {
        name = name.replace(' uw', '');
        variant = 'Unterwasser';
    } else if (name.endsWith(' unterwasser')) {
        name = name.replace(' unterwasser', '');
        variant = 'Unterwasser';
    } else if (name.endsWith(' op')) {
        name = name.replace(' op', '');
        variant = 'Oberpegel';
    } else if (name.endsWith(' up')) {
        name = name.replace(' up', '');
        variant = 'Unterpegel';
    } else if (name.endsWith(' ap')) {
        name = name.replace(' ap', '');
        variant = 'Außenpegel';
    } else if (name.endsWith(' bp')) {
        name = name.replace(' bp', '');
        variant = 'Binnenpegel';
    } else if (name.endsWith(' ep')) {
        name = name.replace(' ep', '');
        variant = 'Elbpegel';
    } else if (name.endsWith(' uf')) {
        name = name.replace(' uf', '');
        variant = 'Unterfeuer';
    } else if (name.endsWith(' stadt')) {
        name = name.replace(' stadt', '');
        variant = 'Stadt';

        // The following cases are no variants, just specifiers
    } else if (name.endsWith(' mpm')) {
        name = name.replace(' mpm', ' MPM'); // Multiparameterstation, is added as synonym later
    } else if (name.endsWith(' nh')) {
        name = name.replace(' nh', ' neuer hafen');
    } else if (name.endsWith(' ro nws')) {
        name = name.replace(' ro nws', ' rothensee niedrigwasserschleuse');
    } else if (name.endsWith(' ska')) {
        name = name.replace(' ska', ' seilkrananlage');
    } else if (name.endsWith(' sp')) {
        name = name.replace(' sp', ' seepegel');
    }

    // capitalize letters after spaces (checking for non letter chars after space, e.g. in "Frankfurt (Oder)")
    name = name
        .split(' ')
        .map((str) => {
            let i = 0;
            while (i < str.length && !isLetter(str.charAt(i))) i++;
            return str.slice(0, i) + str.charAt(i).toUpperCase() + str.slice(i + 1);
        })
        .join(' ')
        .replace(' An Der ', ' an der ');

    if (addVariantToName && variant) {
        name = name + ' ' + variant;
    }
    return { name: name, variant: variant };
}

/**
 * Normalize water name.
 * @param {string} water name of water
 * @returns normalized water name
 */
export function normalizeWater(water) {
    return water
        .toLowerCase()
        .replace('dyhrssenmoor', 'dyhrrsenmoor') // (typo in WSV data)
        .replace('gewaesser', 'gewässer')
        .replace('strasse', 'straße')
        // capitalize letters after hyphens
        .split('-')
        .map((str) => {
            return str.charAt(0).toUpperCase() + str.slice(1);
        })
        .join('-')
        // capitalize letters after spaces
        .split(' ')
        .map((str) => {
            return str.charAt(0).toUpperCase() + str.slice(1);
        })
        .join(' ');
}

/**
 * Returns a description of a date in comparison to today.
 * If date is on the same day as today, returns just the time as "hours:minutes".
 * If date is yesterday, returns just the time as "yesterday hours:minutes".
 * Otherwise, returns date/time according to locale.
 * @param {Date} date the date for which to get the description
 * @param {string} locale locale for formatting
 * @param {Date=} today date to use as today reference
 * @returns description of date  in comparison to today
 */
export function getTimeDesc(date, locale, today = new Date()) {
    if (date.getDate() === today.getDate()) {
        // today, use "hours:minutes"
        return pad(date.getHours()) + ':' + pad(date.getMinutes());
    }

    let yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    if (date.getDate() === yesterday.getDate()) {
        // yesterday, use "yesterday hours:minutes"
        return 'gestern ' + pad(date.getHours()) + ':' + pad(date.getMinutes());
    }

    return date.toLocaleString(locale);
}
