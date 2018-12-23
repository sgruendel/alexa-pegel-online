'use strict';

const expect = require('chai').expect;
const manager = require('../../src/manager');

describe('manager', () => {

    describe('#getCurrentMeasurement()', () => {
        it('should find current measurement for Würzburg', async function() {
            const result = await manager.getCurrentMeasurement('915d76e1-3bf9-4e37-9a9a-4d144cd771cc');
            expect(result.unit).to.be.a('string');
            expect(result.image.small.url).to.be.a('string');
            expect(result.image.large.url).to.be.a('string');
            expect(result.currentMeasurement.timestamp).to.be.a('string');
            expect(result.currentMeasurement.value).to.be.a('number');
            expect(result.currentMeasurement.trend).to.be.a('number');
        });

        it('should remove +NN in unit', async function() {
            const result = await manager.getCurrentMeasurement('6760b547-a7e7-408a-b3aa-529fe376bfcd');
            expect(result.unit).to.not.contain('+NN');
        });

        it('should have local time in timestamp', async function() {
            const result = await manager.getCurrentMeasurement('6760b547-a7e7-408a-b3aa-529fe376bfcd');
            expect(result.currentMeasurement.timestamp).to.not.contain('+');
        });
    });
});