export const BASE_URL = 'https://www.pegelonline.wsv.de';
export const STATION_UUID = '915d76e1-3bf9-4e37-9a9a-4d144cd771cc';

export const stations = [
    {
        uuid: STATION_UUID,
        number: '24042000',
        shortname: 'WÜRZBURG',
        longname: 'WÜRZBURG',
        km: 251.97,
        agency: 'WSA Main',
        longitude: 9.92,
        latitude: 49.79,
        water: {
            shortname: 'MAIN',
            longname: 'MAIN',
        },
    },
];

export const waters = [
    {
        shortname: 'MAIN',
        longname: 'MAIN',
    },
    {
        shortname: 'RHEIN',
        longname: 'RHEIN',
    },
];

export function measurement({ unit = 'cm', timestamp = '2026-09-09T12:30:00+02:00', value = 182.4, trend = 1 } = {}) {
    return {
        shortname: 'W',
        longname: 'WASSERSTAND ROHDATEN',
        unit,
        equidistance: 15,
        currentMeasurement: {
            timestamp,
            value,
            stateMnwMhw: 'normal',
            stateNswHsw: 'normal',
            trend,
        },
        gaugeZero: {
            unit: 'm. ü. NN',
            value: 164.553,
            validFrom: '2011-11-01',
        },
    };
}
