'use strict';

var expect = require('chai').expect;
var pegelonline = require('../pegelonlineRestAPI');

const names = require('../names.json');

describe('pegelonline', () => {
    describe('#getStations()', () => {
        it('should return all stations', done => {
            pegelonline.getStations((err, result) => {
                expect(err).to.be.null;
                expect(result).to.have.length.above(500);

                result.forEach(station => {
                    expect(station.uuid).to.be.a('string');
                    expect(names[station.uuid]).to.exist;
                });

                done();
            });
        });
    });

    describe('#getCurrentMeasurement()', () => {
        it('should give current measurement for Würzburg', done => {
            pegelonline.getCurrentMeasurement('915d76e1-3bf9-4e37-9a9a-4d144cd771cc', (err, result) => {
                expect(err).to.be.null;
                expect(result.unit).to.be.a('string');
                expect(result.currentMeasurement.value).to.be.a('number');
                done();
            });
        });

        it('should not find Eisingen', done => {
            pegelonline.getCurrentMeasurement('Eisingen', (err, result) => {
                expect(err.message).to.equal('Not Found');
                expect(result).to.be.undefined;
                done();
            });
        });
    });

    describe('#getSmallImageUrl()', () => {
        it('should give URL for Würzburg', () => {
            const result = pegelonline.getSmallImageUrl('915d76e1-3bf9-4e37-9a9a-4d144cd771cc');
            expect(result).to.be.a('string');
        });
    });

    describe('#getLargeImageUrl()', () => {
        it('should give URL for Würzburg', () => {
            const result = pegelonline.getLargeImageUrl('915d76e1-3bf9-4e37-9a9a-4d144cd771cc');
            expect(result).to.be.a('string');
        });
    });
});
