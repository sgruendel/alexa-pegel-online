'use strict';

var expect = require('chai').expect;
var pegelonline = require('../pegelonlineRestAPI');

describe('REST-API helpers', function() {
    describe('#getStations()', function() {
        it('should give all stations', function(done) {
            pegelonline.getStations(function(err, result) {
                expect(err).to.be.null;
                expect(result).to.have.length.above(500);
                // TODO refactor test expect(result[0]).to.include.keys('uuid');
                done();
            });
        });
    });

    describe('#getCurrentMeasurement()', function() {
        it('should give current measurement for Würzburg', function(done) {
            pegelonline.getCurrentMeasurement('Würzburg', function(err, result) {
                expect(err).to.be.null;
                expect(result.unit).to.be.a('string');
                expect(result.currentMeasurement.value).to.be.a('number');
                done();
            });
        });

        it('should not find Eisingen', function(done) {
            pegelonline.getCurrentMeasurement('Eisingen', function(err, result) {
                expect(err.message).to.equal('Not Found');
                expect(result).to.be.undefined;
                done();
            });
        });
    });
});
