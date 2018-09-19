'use strict';

const expect = require('chai').expect;
const pegelonline = require('../src/pegelonlineRestAPI');

const names = require('../src/names.json');

describe('pegelonline', () => {
    describe('#getStations()', () => {
        it('should return all stations', async function() {
            const result = await pegelonline.getStations();
            expect(result).to.have.length.above(500);

            result.forEach(station => {
                expect(station.uuid).to.be.a('string');
                expect(names[station.uuid]).to.exist;
            });
        });
    });

    describe('#getUuidsFuzzy()', () => {
        it('should return UUID for Würzburg', async function() {
            const result = await pegelonline.getUuidsFuzzy('wuerzburg');
            expect(result).to.eql(['915d76e1-3bf9-4e37-9a9a-4d144cd771cc']);
        });

        it('should return at least 15 UUIDs for Berlin', async function() {
            const result = await pegelonline.getUuidsFuzzy('berlin');
            expect(result).to.have.length.of.at.least(15);
        });

        it('should return UUID for Affoldern (wrong spelling)', async function() {
            const result = await pegelonline.getUuidsFuzzy('affoltern');
            expect(result).to.eql(['ab9d5a42-2b8d-491b-9fd1-8120df23c8e6']);
        });
    });

    describe('#getUuidsForWater()', () => {
        it('should return UUID for Konstanz when querying Bodensee', async function() {
            const result = await pegelonline.getUuidsForWater('bodensee');
            expect(result).to.eql(['aa9179c1-17ef-4c61-a48a-74193fa7bfdf']);
        });
    });

    describe('#getCurrentMeasurement()', () => {
        it('should give current measurement for Würzburg', async function() {
            const result = await pegelonline.getCurrentMeasurement('915d76e1-3bf9-4e37-9a9a-4d144cd771cc');
            expect(result.unit).to.be.a('string');
            expect(result.currentMeasurement.value).to.be.a('number');
        });

        it('should not find Eisingen', async function() {
            try {
                await pegelonline.getCurrentMeasurement('Eisingen');
            } catch (err) {
                expect(err.statusCode).to.equal(404);
            }
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
