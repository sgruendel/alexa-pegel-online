'use strict';

const pegelonline = require('./pegelonlineRestAPI');

const uuids = require('./uuids.json');
const names = require('./names.json');

var uuidsForLowerNames = {};
Object.keys(uuids).forEach(name => {
    uuidsForLowerNames[name.toLowerCase()] = uuids[name];
});

var exports = module.exports = {};

exports.findUuidsFor = function(station, callback) {
    const uuid = uuidsForLowerNames[station.toLowerCase()];

    if (uuid) {
        // we have a perfect match!
        console.log('found perfect match:', uuid);
        return callback(null, [uuid]);
    }

    // try to interpret station as water body
    pegelonline.getUuidsForWater(station, (err, uuids) => {
        if (uuids && uuids.length > 0) {
            // we have at least one water body match
            console.log('found water matches:', uuids);
            return callback(null, uuids);
        }

        pegelonline.getUuidsFuzzy(station, (err, uuids) => {
            if (uuids && uuids.length > 0) {
                // we have at least one fuzzy match
                console.log('found fuzzy matches:', uuids);
                return callback(null, uuids);
            }

            // search for best match
            uuids = [];
            Object.keys(uuidsForLowerNames).forEach(name => {
                if (name.startsWith(station)) {
                    uuids.push(uuidsForLowerNames[name]);
                }
            });
            if (uuids.length > 0) {
                console.log('found matches:', uuids);
                return callback(null, uuids);
            }
            return callback(new Error('No match found for ' + station));
        });
    });
};

exports.currentMeasurementForUuids = function(uuids, callback) {
    // TODO Alexa dialog for multiple fuzzy matches (like UW/OW or UP/OP stations), or return both values
    const uuid = uuids[0];
    console.log('using station', names[uuid], '/ uuid', uuid);
    pegelonline.getCurrentMeasurement(uuid, (err, result) => {
        if (err) {
            return callback(err);
        }

        result.station = names[uuid];

        if (result.unit.endsWith('+NN')) {
            // Bad Essen liefert "m+NN"
            result.unit = result.unit.slice(0, result.unit.length - 3);
        }

        if (result.currentMeasurement.timestamp) {
            // Zeitzonen-Offset entfernen, damit ein daraus erzeugtes Date-Objekt als Lokalzeit behandelt wird
            result.currentMeasurement.timestamp = result.currentMeasurement.timestamp.replace(/[-+][0-9][0-9]:[0-9][0-9]/, '');
        }

        result.smallImageUrl = pegelonline.getSmallImageUrl(uuid);
        result.largeImageUrl = pegelonline.getLargeImageUrl(uuid);

        return callback(null, result);
    });
};
