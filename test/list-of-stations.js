'use strict';

const expect = require('chai').expect;
const fs = require('fs');
// const pegelonline = require('../src/pegelonlineRestAPI');

const stations = fs.readFileSync('skill/slot-LIST_OF_STATIONS.txt').toString().split('\n');
const uuids = require('../src/uuids.json');
const names = require('../src/names.json');

describe('stations data', function() {

    stations.forEach(station => {
        if (station) {
            // skip trailing empty line

            const uuid = uuids[station];
            it('should have a uuid for ' + station, () => {
                expect(uuid).to.exist;
            });
            it('should have a name for ' + station, () => {
                expect(names[uuid]).to.exist;
            });

            // This shouldn't be run regularly as it's time consuming ...
            // it('should give current measurement for ' + station, function(done) {
            //     pegelonline.getCurrentMeasurement(uuids[station], function(err, result) {
            //         if (err) {
            //             expect(err.message).to.equal('Not Found');
            //         } else {
            //             expect(result.unit).to.be.a('string');
            //             expect(result.currentMeasurement.value).to.be.a('number');
            //         }
            //         done();
            //     });
            // });
        }
    });
});
