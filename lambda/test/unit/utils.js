import { expect } from 'chai';

import * as utils from '../../utils.js';

const LOCALE = 'de-DE';

describe('utils', () => {
    describe('#normalizeStation()', () => {
        it('should work for Artlenburg (Elbe)', () => {
            const result = utils.normalizeStation('ARTLENBURG', 'ELBE');
            expect(result).to.deep.equal({ name: 'Artlenburg (Elbe)', variant: undefined });
        });

        it('should work for Artlenburg (Elbeseitenkanal)', () => {
            const result = utils.normalizeStation('ARTLENBURG-ESK', 'ELBESEITENKANAL');
            expect(result).to.deep.equal({ name: 'Artlenburg (Elbeseitenkanal)', variant: undefined });
        });

        it('should work for Besigheim Seilkrananlage', () => {
            const result = utils.normalizeStation('BESIGHEIM SKA', 'NECKAR');
            expect(result).to.deep.equal({ name: 'Besigheim Seilkrananlage', variant: undefined });
        });

        it('should work for Brunsbüttel MPM', () => {
            const result = utils.normalizeStation('BRUNSBÜTTEL MPM', 'NORD-OSTSEE-KANAL');
            expect(result).to.deep.equal({ name: 'Brunsbüttel MPM', variant: undefined });
        });

        it('should work for Brunsbüttel (Nord-Ostsee-Kanal)', () => {
            const result = utils.normalizeStation('BRUNSBÜTTEL', 'NORD-OSTSEE-KANAL');
            expect(result).to.deep.equal({ name: 'Brunsbüttel (Nord-Ostsee-Kanal)', variant: undefined });
        });

        it('should work for Brunsbüttel Mole 1', () => {
            const result = utils.normalizeStation('BRUNSBÜTTEL MOLE 1', 'ELBE');
            expect(result).to.deep.equal({ name: 'Brunsbüttel Mole Eins', variant: undefined });
        });

        it('should work for Calbe-Grizehne', () => {
            const result = utils.normalizeStation('CALBE GRIZEHNE', 'SAALE');
            expect(result).to.deep.equal({ name: 'Calbe-Grizehne', variant: undefined });
        });

        it('should work for Calbe (Saale) (UP)', () => {
            const result = utils.normalizeStation('CALBE UP', 'SAALE');
            expect(result).to.deep.equal({ name: 'Calbe (Saale)', variant: 'Unterpegel' });
        });

        it('should work for Calbe (Saale) (OP)', () => {
            const result = utils.normalizeStation('CALBE OP', 'SAALE');
            expect(result).to.deep.equal({ name: 'Calbe (Saale)', variant: 'Oberpegel' });
        });

        it('should work for Dömitz (Elbe)', () => {
            const result = utils.normalizeStation('DÖMITZ', 'ELBE');
            expect(result).to.deep.equal({ name: 'Dömitz (Elbe)', variant: undefined });
        });

        it('should work for Dömitz (MEW) UP', () => {
            const result = utils.normalizeStation('DOEMITZ UP', 'MÜRITZ-ELDE-WASSERSTRASSE');
            expect(result).to.deep.equal({ name: 'Dömitz (Müritz-Elde-Wasserstraße)', variant: 'Unterpegel' });
        });

        it('should work for Dömitz (MEW) OP', () => {
            const result = utils.normalizeStation('DOEMITZ OP', 'MÜRITZ-ELDE-WASSERSTRASSE');
            expect(result).to.deep.equal({ name: 'Dömitz (Müritz-Elde-Wasserstraße)', variant: 'Oberpegel' });
        });

        it('should work for Elsfleth (Hunte)', () => {
            const result = utils.normalizeStation('ELSFLETH OHRT', 'HUNTE');
            expect(result).to.deep.equal({ name: 'Elsfleth (Hunte)', variant: undefined });
        });

        it('should work for Elsfleth (Weser)', () => {
            const result = utils.normalizeStation('ELSFLETH', 'WESER');
            expect(result).to.deep.equal({ name: 'Elsfleth (Weser)', variant: undefined });
        });

        it('should work for Eisenhüttenstadt (Oder)', () => {
            const result = utils.normalizeStation('EISENHÜTTENSTADT', 'ODER');
            expect(result).to.deep.equal({ name: 'Eisenhüttenstadt (Oder)', variant: undefined });
        });

        it('should work for Fürstenwalde (UP)', () => {
            const result = utils.normalizeStation('FUERSTENWALDE UP', 'SPREE-ODER-WASSERSTRASSE');
            expect(result).to.deep.equal({ name: 'Fürstenwalde', variant: 'Unterpegel' });
        });

        it('should work for Fürstenwalde (OP)', () => {
            const result = utils.normalizeStation('FUERSTENWALDE OP', 'SPREE-ODER-WASSERSTRASSE');
            expect(result).to.deep.equal({ name: 'Fürstenwalde', variant: 'Oberpegel' });
        });

        it('should work for Geesthacht (Elbe)', () => {
            const result = utils.normalizeStation('GEESTHACHT', 'ELBE');
            expect(result).to.deep.equal({ name: 'Geesthacht (Elbe)', variant: undefined });
        });

        it('should work for Havelberg (Stadt)', () => {
            const result = utils.normalizeStation('HAVELBERG STADT', 'UNTERE HAVEL-WASSERSTRASSE');
            expect(result).to.deep.equal({ name: 'Havelberg', variant: 'Stadt' });
        });

        it('should work for Ilmenau (Ilm)', () => {
            const result = utils.normalizeStation('ILMENAU', 'ILM');
            expect(result).to.deep.equal({ name: 'Ilmenau an der Ilm', variant: undefined });
        });

        it('should work for Koblenz (Rhein)', () => {
            const result = utils.normalizeStation('KOBLENZ', 'RHEIN');
            expect(result).to.deep.equal({ name: 'Koblenz (Rhein)', variant: undefined });
        });

        it('should work for Koblenz (Mosel)', () => {
            const result = utils.normalizeStation('KOBLENZ UP', 'MOSEL');
            expect(result).to.deep.equal({ name: 'Koblenz (Mosel)', variant: undefined });
        });

        it('should work for Konstanz (Bodensee)', () => {
            const result = utils.normalizeStation('KONSTANZ', 'BODENSEE');
            expect(result).to.deep.equal({ name: 'Konstanz (Bodensee)', variant: undefined });
        });

        it('should work for Konstanz (Rhein)', () => {
            const result = utils.normalizeStation('KONSTANZ-RHEIN', 'RHEIN');
            expect(result).to.deep.equal({ name: 'Konstanz (Rhein)', variant: undefined });
        });

        it('should work for Magdeburg', () => {
            const result = utils.normalizeStation('MAGDEBURG RO NWS', 'ROTHENSEER-VERBINDUNGSKANAL');
            expect(result).to.deep.equal({ name: 'Magdeburg Rothensee Niedrigwasserschleuse', variant: undefined });
        });

        it('should work for Mannheim (Neckar)', () => {
            const result = utils.normalizeStation('MANNHEIM NECKAR', 'NECKAR');
            expect(result).to.deep.equal({ name: 'Mannheim (Neckar)', variant: undefined });
        });

        it('should work for Mannheim (Rhein)', () => {
            const result = utils.normalizeStation('MANNHEIM', 'RHEIN');
            expect(result).to.deep.equal({ name: 'Mannheim (Rhein)', variant: undefined });
        });

        it('should work for Neustadt (Leine)', () => {
            const result = utils.normalizeStation('NEUSTADT', 'LEINE');
            expect(result).to.deep.equal({ name: 'Neustadt (Leine)', variant: undefined });
        });

        it('should work for Neustadt (Ostsee)', () => {
            const result = utils.normalizeStation('NEUSTADT', 'OSTSEE');
            expect(result).to.deep.equal({ name: 'Neustadt (Ostsee)', variant: undefined });
        });

        it('should work for Neustadt-Glewe', () => {
            const result = utils.normalizeStation('NEUSTADT GLEWE OP', 'MÜRITZ-ELDE-WASSERSTRASSE');
            expect(result).to.deep.equal({ name: 'Neustadt-Glewe', variant: 'Oberpegel' });
        });

        it('should work for Neuwied', () => {
            const result = utils.normalizeStation('NEUWIED STADT', 'RHEIN');
            expect(result).to.deep.equal({ name: 'Neuwied', variant: undefined });
        });

        it('should work for Nienburg (Saale)', () => {
            const result = utils.normalizeStation('NIENBURG (SAALE)', 'SAALE');
            expect(result).to.deep.equal({ name: 'Nienburg (Saale)', variant: undefined });
        });

        it('should work for Nienburg (Weser)', () => {
            const result = utils.normalizeStation('NIENBURG', 'WESER');
            expect(result).to.deep.equal({ name: 'Nienburg (Weser)', variant: undefined });
        });

        it('should work for Rotenburg (Fulda)', () => {
            const result = utils.normalizeStation('ROTENBURG', 'FULDA');
            expect(result).to.deep.equal({ name: 'Rotenburg an der Fulda', variant: undefined });
        });

        it('should work for Rothenburg (Saale) OP', () => {
            const result = utils.normalizeStation('ROTHENBURG OP', 'SAALE');
            expect(result).to.deep.equal({ name: 'Rothenburg (Saale)', variant: 'Oberpegel' });
        });

        it('should work for Rothenburg (Saale) UP', () => {
            const result = utils.normalizeStation('ROTHENBURG UP', 'SAALE');
            expect(result).to.deep.equal({ name: 'Rothenburg (Saale)', variant: 'Unterpegel' });
        });

        it('should work for Schleimünde Seepegel', () => {
            const result = utils.normalizeStation('SCHLEIMÜNDE SP', 'OSTSEE');
            expect(result).to.deep.equal({ name: 'Schleimünde Seepegel', variant: undefined });
        });

        it('should work for Waren (Müritz)', () => {
            const result = utils.normalizeStation('WAREN', 'MÜRITZ-ELDE-WASSERSTRASSE');
            expect(result).to.deep.equal({ name: 'Waren (Müritz)', variant: undefined });
        });

        it('should work for Oberwasser (OW)', () => {
            const result = utils.normalizeStation('DATTELN SCHLEUSE OW', 'WESEL-DATTELN-KANAL');
            expect(result).to.deep.equal({ name: 'Datteln Schleuse', variant: 'Oberwasser' });
        });

        it('should work for Oberwasser', () => {
            const result = utils.normalizeStation('NORDFELD OBERWASSER', 'EIDER');
            expect(result).to.deep.equal({ name: 'Nordfeld', variant: 'Oberwasser' });
        });

        it('should work for Unterwasser (UW)', () => {
            const result = utils.normalizeStation('DATTELN SCHLEUSE UW', 'WESEL-DATTELN-KANAL');
            expect(result).to.deep.equal({ name: 'Datteln Schleuse', variant: 'Unterwasser' });
        });

        it('should work for Unterwasser', () => {
            const result = utils.normalizeStation('NORDFELD UNTERWASSER', 'EIDER');
            expect(result).to.deep.equal({ name: 'Nordfeld', variant: 'Unterwasser' });
        });

        it('should work for Oberpegel', () => {
            const result = utils.normalizeStation('ZERBEN OP', 'ELBE-HAVEL-KANAL');
            expect(result).to.deep.equal({ name: 'Zerben', variant: 'Oberpegel' });
        });

        it('should work for Unterpegel', () => {
            const result = utils.normalizeStation('ZERBEN UP', 'ELBE-HAVEL-KANAL');
            expect(result).to.deep.equal({ name: 'Zerben', variant: 'Unterpegel' });
        });

        it('should work for Außenpegel', () => {
            const result = utils.normalizeStation('HOHENSAATEN WEST AP', 'HAVEL-ODER-WASSERSTRASSE');
            expect(result).to.deep.equal({ name: 'Hohensaaten West', variant: 'Außenpegel' });
        });

        it('should work for Binnenpegel', () => {
            const result = utils.normalizeStation('HOHENSAATEN WEST BP', 'HAVEL-ODER-WASSERSTRASSE');
            expect(result).to.deep.equal({ name: 'Hohensaaten West', variant: 'Binnenpegel' });
        });

        it('should work for Elbpegel', () => {
            const result = utils.normalizeStation('PAREY EP', 'PAREYER VERBINDUNGSKANAL');
            expect(result).to.deep.equal({ name: 'Parey', variant: 'Elbpegel' });
        });

        it('should work for Unterfeuer', () => {
            const result = utils.normalizeStation('BLANKENESE UF', 'ELBE');
            expect(result).to.deep.equal({ name: 'Blankenese', variant: 'Unterfeuer' });
        });

        it('should work for Neuer Hafen', () => {
            const result = utils.normalizeStation('SCHWEINFURT NH', 'MAIN');
            expect(result).to.deep.equal({ name: 'Schweinfurt Neuer Hafen', variant: undefined });
        });
    });

    describe('#normalizeWater()', () => {
        it('should work for Lychener Gewässer', () => {
            const result = utils.normalizeWater('LYCHENER GEWÄSSER');
            expect(result).to.equal('Lychener Gewässer');
        });

        it('should work for Main-Donau-Kanal', () => {
            const result = utils.normalizeWater('MAIN-DONAU-KANAL');
            expect(result).to.equal('Main-Donau-Kanal');
        });
    });

    describe('#getTimeDesc()', () => {
        const cases = [
            ['morning', '2026-09-11T08:12:00+02:00', '2026-09-11T18:00:00+02:00', '08:12'],
            ['minutes', '2026-09-11T12:01:00+02:00', '2026-09-11T18:00:00+02:00', '12:01'],
            ['afternoon', '2026-09-11T15:00:00+02:00', '2026-09-11T18:00:00+02:00', '15:00'],
            ['yesterday', '2026-09-10T08:01:00+02:00', '2026-09-11T18:00:00+02:00', 'gestern 08:01'],
            ['year boundary', '2025-12-31T08:01:00+01:00', '2026-01-01T00:00:00+01:00', 'gestern 08:01'],
            ['leap day', '2024-02-29T08:02:00+01:00', '2024-03-01T00:00:00+01:00', 'gestern 08:02'],
            ['spring DST', '2026-03-28T23:30:00+01:00', '2026-03-30T00:15:00+02:00', '28.3.2026, 23:30:00'],
            ['autumn DST', '2026-10-25T00:30:00+02:00', '2026-10-26T00:15:00+01:00', 'gestern 00:30'],
            ['UTC at German midnight', '2026-09-10T22:30:00Z', '2026-09-10T23:00:00Z', '00:30'],
            ['previous month', '2026-08-11T12:30:00+02:00', '2026-09-11T13:00:00+02:00', '11.8.2026, 12:30:00'],
            ['previous year', '2025-09-10T12:30:00+02:00', '2026-09-11T13:00:00+02:00', '10.9.2025, 12:30:00'],
        ];
        for (const [name, measurement, reference, expected] of cases) {
            it(`formats ${name} in Europe/Berlin`, () => {
                expect(utils.getTimeDesc(new Date(measurement), LOCALE, new Date(reference))).to.equal(expected);
            });
        }
    });
});
