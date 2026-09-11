import { expect } from 'chai';
import * as pegelonline from '../../pegelonline.js';
import { STATION_UUID } from '../fixtures/pegelonline.js';

describe('live PegelOnline API contract', function () {
    this.timeout(10000);

    it('returns station IDs, names, and waters', async () => {
        const stations = await pegelonline.getStations();
        expect(stations).to.be.an('array').that.is.not.empty;
        for (const station of stations) {
            expect(station.uuid).to.be.a('string').that.is.not.empty;
            expect(station.longname).to.be.a('string').that.is.not.empty;
            expect(station.water.longname).to.be.a('string').that.is.not.empty;
        }
    });

    it('returns a timestamped measurement for Würzburg', async () => {
        const result = await pegelonline.getCurrentMeasurement(STATION_UUID);
        expect(result.unit).to.be.a('string').that.is.not.empty;
        expect(Number.isFinite(result.currentMeasurement.value)).to.equal(true);
        expect(Number.isFinite(Date.parse(result.currentMeasurement.timestamp))).to.equal(true);
    });
});
