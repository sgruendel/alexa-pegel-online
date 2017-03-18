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
            pegelonline.getCurrentMeasurement('915d76e1-3bf9-4e37-9a9a-4d144cd771cc', function(err, result) {
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

    describe('#getSmallImageUrl()', function() {
        it('should give URL for Würzburg', function() {
            var result = pegelonline.getSmallImageUrl('915d76e1-3bf9-4e37-9a9a-4d144cd771cc');
            expect(result).to.be.a('string');
        });
    });

    describe('#getLargeImageUrl()', function() {
        it('should give URL for Würzburg', function() {
            var result = pegelonline.getLargeImageUrl('915d76e1-3bf9-4e37-9a9a-4d144cd771cc');
            expect(result).to.be.a('string');
        });
    });
});
