'use strict';

const fs = require('fs');
const pegelonline = require('./pegelonlineRestAPI');

function normalizeName(name) {
    name = name.toLowerCase();
    var pos;

    // Eisenhuettenstadt Schl. => Schleuse
    pos = name.indexOf('schl.');
    if (pos >= 0) {
        name = name.replace('schl.', 'schleuse');
    }

    // Hann. Münden => Hannoversch Münden
    name = name.replace('hann.muenden', 'hannoversch münden');
    // Hann. => Hannover
    pos = name.indexOf('hann.');
    if (pos >= 0) {
        name = name.replace('hann.', 'hannover ');
    }

    // St. => Sankt
    pos = name.indexOf('st.');
    if (pos >= 0) {
        name = name.replace('st.', 'sankt ');
    }

    // Whv => Wilhelmshaven
    pos = name.indexOf('whv ');
    if (pos >= 0) {
        name = name.replace('whv ', 'wilhelmshaven ');
    }

    // OW/UW/OP/UP
    if (name.endsWith(' ow')) {
        name = name.replace(' ow', ' oberwasser');
    } else if (name.endsWith(' uw')) {
        name = name.replace(' uw', ' unterwasser');
    } else if (name.endsWith(' op')) {
        name = name.replace(' op', ' oberpegel');
    } else if (name.endsWith(' up')) {
        name = name.replace(' up', ' unterpegel');
    } else if (name.endsWith(' ap')) {
        name = name.replace(' ap', ' außenpegel');
    } else if (name.endsWith(' bp')) {
        name = name.replace(' bp', ' binnenpegel');
    }

    // TODO AP/BP/EP ???

    // replace hyphens and underscores by spaces as Alexa won't add them to slot values
    // replace multiple spaces by one and remove trailing space
    name = name.replace('-', ' ').replace('_', ' ').replace(/ +/g, ' ').trim();

    // capitalize letters after spaces
    name = name.split(' ').map(str => {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }).join(' ');

    return name;
}

pegelonline.getStations((err, result) => {
    if (result) {
        var uuids = {};
        var names = {};

        result.forEach(station => {
            // map station uuids to names
            const longname = normalizeName(station.longname);

            // const shortname = normalizeName(station.shortname);
            // if (shortname != longname) {
            //     console.log(shortname, '<=>', longname);
            // }
            //
            // Nur in folgenden Fällen unterscheiden sich shortname <=> longname:
            // neue mühle schleuse unterpegel <=> neue mühle unterpegel
            // neue mühle schleuse oberpegel <=> neue mühle oberpegel
            // hamburg-st.pauli <=> hamburg st. pauli
            // ilmenau sperrwerk ap <=> ilmenau-sperrwerk ap
            // gießen klärwerk <=> giessen klärwerk
            // schweinfurt nh <=> schweinfurt neuer hafen
            // timmendorf/poel <=> timmendorf poel
            // demmin <=> demmin-meyenkrebsbrücke
            //
            // Wir nehmen einfach immer den longname

            uuids[longname] = station.uuid;
            names[station.uuid] = longname;
        });

        // serialize station uuid to name mapping to be used when calling Alexa Intent with station name
        var stream = fs.createWriteStream('src/uuids.json');
        stream.write(JSON.stringify(uuids, null, 2));
        stream.end();

        // serialize normalized station name to uuid mapping to be used when showing the actual station found
        stream = fs.createWriteStream('src/names.json');
        stream.write(JSON.stringify(names, null, 2));
        stream.end();

        // write sorted list of station names to be used as slot values for the Alexa Intent
        var namesArray = [];
        Object.keys(uuids).forEach(name => {
            namesArray.push(name);
        });

        stream = fs.createWriteStream('skill/slot-LIST_OF_STATIONS.txt');
        namesArray.sort().forEach(name => {
            stream.write(name + '\n');
        });
        stream.end();
    }
});
