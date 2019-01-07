'use strict';

function isLetter(c) {
    return c.toLowerCase() !== c.toUpperCase();
}

function pad(minutes) {
    return (minutes < 10) ? ('0' + minutes) : minutes;
}

var exports = module.exports = {};

exports.normalizeStation = (name, water) => {
    // AwK => '' (remove leading Achterwehrer Schifffahrtskanal)
    // Bhv => Bremerhaven
    // Eisenhuettenstadt Schl. => Schleuse
    // Frankfurt1 (oder) => Frankfurt (Oder)
    // Giessen => Gießen
    // Hann. Münden => Hannoversch Münden
    // Hann. => Hannover
    // Lt => Leuchtturm
    // Luenburg => Lüneburg
    // Nok => '' (removing leading Nord-Ostsee-Kanal)
    // St. => Sankt
    // Shw => Schiffshebewerk
    // strohplao => Strohauser Plate Ost
    // Suelfeld => Sülfeld
    // Whv => Wilhelmshaven
    name = name.toLowerCase()
        .replace('awk ', '')
        .replace('bhv ', 'bremerhaven ')
        .replace('schl.', 'schleuse')
        .replace('frankfurt1', 'frankfurt')
        .replace('giessen', 'gießen')
        .replace('hann.muenden', 'hannoversch münden')
        .replace('hann.', 'hannover ')
        .replace('lt ', 'leuchtturm ')
        .replace('lueneburg', 'lüneburg')
        .replace('nok ', '')
        .replace('st.', 'sankt ')
        .replace('shw ', 'schiffshebewerk ')
        .replace('strohplao', 'strohauser plate ost')
        .replace('suelfeld', 'sülfeld')
        .replace('whv ', 'wilhelmshaven ');

    // replace hyphens, underscores and slashes by spaces as Alexa won't add them to slot values
    // replace multiple spaces by one and remove trailing space
    name = name.replace('-', ' ').replace('_', ' ').replace('/', ' ').replace(/ +/g, ' ').trim();

    // Give unique, meaningful names to non-unique stations
    if (name === 'artlenburg' || name === 'artlenburg elk') {
        name = 'artlenburg (' + exports.normalizeWater(water) + ')';
    } else if (name === 'brunsbüttel') {
        name = 'brunsbüttel (' + exports.normalizeWater(water) + ')';
    } else if (name === 'brunsbüttel mole 1') {
        name = 'brunsbüttel mole eins';
    } else if (name === 'dömitz') {
        name = 'dömitz (' + exports.normalizeWater(water) + ')';
    } else if (name === 'doemitz up') {
        name = 'dömitz (' + exports.normalizeWater(water) + ') up';
    } else if (name === 'doemitz op') {
        name = 'dömitz (' + exports.normalizeWater(water) + ') op';
    } else if (name === 'koblenz' || name === 'koblenz up') {
        name = 'koblenz (' + exports.normalizeWater(water) + ')';
    } else if (name === 'neustadt') {
        name = 'neustadt (' + exports.normalizeWater(water) + ')';
    } else if (name === 'neustadt glewe op') {
        name = 'neustadt-Glewe op';
    } else if (name === 'nienburg') {
        name = 'nienburg (' + exports.normalizeWater(water) + ')';
    }

    var variant;
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

    // TODO Nord/Ost/West ...
    } else if (name.endsWith(' mpm')) {
        name = name.replace(' mpm', ''); // TODO: Mpm???
    } else if (name.endsWith(' wd')) {
        name = name.replace(' wd', ''); // TODO: Wd???
    } else if (name.endsWith(' ams')) {
        name = name.replace(' ams', ''); // TODO: Ams???

    // The following cases are no variants, just specifiers
    } else if (name.endsWith(' nh')) {
        name = name.replace(' nh', ' neuer hafen');
    } else if (name.endsWith(' nok')) {
        name = name.replace(' nok', ' nord-Ostsee-Kanal');
    } else if (name.endsWith(' ro nws')) {
        name = name.replace(' ro nws', ' rothensee niedrigwasserschleuse');
    } else if (name.endsWith(' ska')) {
        name = name.replace(' ska', ' seilkrananlage');
    } else if (name.endsWith(' sp')) {
        name = name.replace(' sp', ' seepegel');
    }

    // capitalize letters after spaces (checking for non letter chars after space, e.g. in "Frankfurt (Oder)")
    name = name.split(' ').map(str => {
        var i = 0;
        while (i < str.length && !isLetter(str.charAt(i))) i++;
        return str.slice(0, i) + str.charAt(i).toUpperCase() + str.slice(i + 1);
    }).join(' ');

    return { name: name, variant: variant };
};

exports.normalizeWater = water => {
    water = water.toLowerCase()
        .replace('gewaesser', 'gewässer')
        .replace('strasse', 'straße')
        // capitalize letters after hyphens
        .split('-').map(str => {
            return str.charAt(0).toUpperCase() + str.slice(1);
        }).join('-')
        // capitalize letters after spaces
        .split(' ').map(str => {
            return str.charAt(0).toUpperCase() + str.slice(1);
        }).join(' ');
    return water;
};

exports.getTimeDesc = (date, locale, today = new Date()) => {
    if (date.getDate() === today.getDate()) {
        // today, use "hours:minutes"
        return pad(date.getHours()) + ':' + pad(date.getMinutes());
    }

    var yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    if ((date.getDate()) === yesterday.getDate()) {
        // yesterday, use "yesterday hours:minutes"
        return 'gestern ' + pad(date.getHours()) + ':' + pad(date.getMinutes());
    }

    return date.toLocaleString(locale);
};
