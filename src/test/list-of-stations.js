'use strict';

const expect = require('chai').expect;
const fs = require('fs');
const pegelonline = require('../pegelonlineRestAPI');

const stations = fs.readFileSync('../slot-LIST_OF_STATIONS.txt').toString().split("\n");
const uuids = require('../uuids.json');

describe('REST-API helpers', function() {
    describe('#getCurrentMeasurement()', function() {

        stations.forEach(function(station) {
            if (station) {
                // skip trailing empty line
                
                it('should have a uuid for ' + station, function() {
                    expect(uuids[station]).to.exist;
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
});
