'use strict';

const expect = require('chai').expect;
const pegelonline = require('../../pegelonline');

describe('pegelonline', () => {
    describe('#getStations()', () => {
        it('should return all stations', async() => {
            const result = await pegelonline.getStations();
            expect(result).to.have.length.above(500);

            result.forEach(station => {
                expect(station.uuid).to.be.a('string');
            });
        });
    });

    describe('#getWaters()', () => {
        it('should return all waters', async() => {
            const result = await pegelonline.getWaters();
            expect(result).to.have.length.above(90);

            result.forEach(water => {
                expect(water.shortname).to.be.a('string');
                expect(water.longname).to.be.a('string');
            });
        });
    });

    describe('#getCurrentMeasurement()', () => {
        it('should give current measurement for Würzburg', async() => {
            const result = await pegelonline.getCurrentMeasurement('915d76e1-3bf9-4e37-9a9a-4d144cd771cc');
            expect(result.unit).to.be.a('string');
            expect(result.currentMeasurement.value).to.be.a('number');
        });

        it('should not find Anderten', async() => {
            try {
                await pegelonline.getCurrentMeasurement('98daae03-5aaa-4284-9717-7d52da4fe063');
            } catch (err) {
                expect(err.statusCode).to.equal(404);
            }
        });
    });

    describe('#getImage()', () => {
        const result = pegelonline.getImage('915d76e1-3bf9-4e37-9a9a-4d144cd771cc');

        it('should give xsmall image for Würzburg', () => {
            expect(result.xsmall.url).to.be.a('string');
            expect(result.xsmall.width).to.be.a('number');
            expect(result.xsmall.height).to.be.a('number');
        });

        it('should give small image for Würzburg', () => {
            expect(result.small.url).to.be.a('string');
            expect(result.small.width).to.be.a('number');
            expect(result.small.height).to.be.a('number');
        });

        it('should give medium image for Würzburg', () => {
            expect(result.medium.url).to.be.a('string');
            expect(result.medium.width).to.be.a('number');
            expect(result.medium.height).to.be.a('number');
        });

        it('should give large image for Würzburg', () => {
            expect(result.large.url).to.be.a('string');
            expect(result.large.width).to.be.a('number');
            expect(result.large.height).to.be.a('number');
        });

        it('should give xlarge image for Würzburg', () => {
            expect(result.xlarge.url).to.be.a('string');
            expect(result.xlarge.width).to.be.a('number');
            expect(result.xlarge.height).to.be.a('number');
        });
    });
});
