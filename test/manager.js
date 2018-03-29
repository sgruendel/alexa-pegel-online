'use strict';

var expect = require('chai').expect;
var manager = require('../src/manager');

describe('manager', () => {

    describe('#findUuidsFor()', () => {
        it('should find a perfect match', (done) => {
            manager.findUuidsFor('würzburg', (err, uuids) => {
                expect(err).to.be.null;
                expect(uuids).to.eql(['915d76e1-3bf9-4e37-9a9a-4d144cd771cc']);
                done();
            });
        });

        it('should find a water body match', (done) => {
            manager.findUuidsFor('bodensee', (err, uuids) => {
                expect(err).to.be.null;
                expect(uuids).to.eql(['aa9179c1-17ef-4c61-a48a-74193fa7bfdf']);
                done();
            });
        });

        it('should find a fuzzy match', (done) => {
            manager.findUuidsFor('affoltern', (err, uuids) => {
                expect(err).to.be.null;
                expect(uuids).to.eql(['ab9d5a42-2b8d-491b-9fd1-8120df23c8e6']);
                done();
            });
        });

        it('should find two best matches', (done) => {
            manager.findUuidsFor('wilhelmshaven', (err, uuids) => {
                expect(err).to.be.null;
                expect(uuids).to.eql(['f85bd17b-06c7-49bd-8bfc-ee2bf3ffea99', 'f77317d9-654f-4f51-925e-004c592049da']);
                done();
            });
        });

        it('should find no match', (done) => {
            manager.findUuidsFor('xyzxyzxyz', (err, uuids) => {
                expect(err).to.not.be.null;
                expect(uuids).to.be.undefined;
                done();
            });
        });
    });

    describe('#currentMeasurementForUuids()', () => {
        it('should find current measurement for Würzburg', (done) => {
            manager.currentMeasurementForUuids(['915d76e1-3bf9-4e37-9a9a-4d144cd771cc'], (err, result) => {
                expect(err).to.be.null;
                expect(result.station).to.equal('Würzburg');
                expect(result.unit).to.be.a('string');
                expect(result.smallImageUrl).to.be.a('string');
                expect(result.largeImageUrl).to.be.a('string');
                expect(result.currentMeasurement.timestamp).to.be.a('string');
                expect(result.currentMeasurement.value).to.be.a('number');
                expect(result.currentMeasurement.trend).to.be.a('number');
                done();
            });
        });

        it('should remove +NN in unit', (done) => {
            manager.currentMeasurementForUuids(['6760b547-a7e7-408a-b3aa-529fe376bfcd'], (err, result) => {
                expect(err).to.be.null;
                expect(result.station).to.equal('Bad Essen');
                expect(result.unit).to.not.contain('+NN');
                done();
            });
        });

        it('should have local time in timestamp', (done) => {
            manager.currentMeasurementForUuids(['6760b547-a7e7-408a-b3aa-529fe376bfcd'], (err, result) => {
                expect(err).to.be.null;
                expect(result.currentMeasurement.timestamp).to.not.contain('+');
                done();
            });
        });
    });
});
