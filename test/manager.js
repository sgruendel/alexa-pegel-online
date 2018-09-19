'use strict';

var expect = require('chai').expect;
var manager = require('../src/manager');

describe('manager', () => {

    describe('#findUuidsFor()', () => {
        it('should find a perfect match', async function() {
            const uuids = await manager.findUuidsFor('würzburg');
            expect(uuids).to.eql(['915d76e1-3bf9-4e37-9a9a-4d144cd771cc']);
        });

        it('should find a water body match', async function() {
            const uuids = await manager.findUuidsFor('bodensee');
            expect(uuids).to.eql(['aa9179c1-17ef-4c61-a48a-74193fa7bfdf']);
        });

        it('should find a fuzzy match', async function() {
            const uuids = await manager.findUuidsFor('affoltern');
            expect(uuids).to.eql(['ab9d5a42-2b8d-491b-9fd1-8120df23c8e6']);
        });

        it('should find two best matches', async function() {
            const uuids = await manager.findUuidsFor('wilhelmshaven');
            expect(uuids).to.eql(['f85bd17b-06c7-49bd-8bfc-ee2bf3ffea99', 'f77317d9-654f-4f51-925e-004c592049da']);
        });

        it('should find no match', async function() {
            const uuids = await manager.findUuidsFor('xyzxyzxyz');
            expect(uuids).to.be.undefined;
        });
    });

    describe('#currentMeasurementForUuids()', () => {
        it('should find current measurement for Würzburg', async function() {
            const result = await manager.currentMeasurementForUuids(['915d76e1-3bf9-4e37-9a9a-4d144cd771cc']);
            expect(result.station).to.equal('Würzburg');
            expect(result.unit).to.be.a('string');
            expect(result.smallImageUrl).to.be.a('string');
            expect(result.largeImageUrl).to.be.a('string');
            expect(result.currentMeasurement.timestamp).to.be.a('string');
            expect(result.currentMeasurement.value).to.be.a('number');
            expect(result.currentMeasurement.trend).to.be.a('number');
        });

        it('should remove +NN in unit', async function() {
            const result = await manager.currentMeasurementForUuids(['6760b547-a7e7-408a-b3aa-529fe376bfcd']);
            expect(result.station).to.equal('Bad Essen');
            expect(result.unit).to.not.contain('+NN');
        });

        it('should have local time in timestamp', async function() {
            const result = await manager.currentMeasurementForUuids(['6760b547-a7e7-408a-b3aa-529fe376bfcd']);
            expect(result.currentMeasurement.timestamp).to.not.contain('+');
        });
    });
});
