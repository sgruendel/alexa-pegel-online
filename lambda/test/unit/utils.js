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
            const result = utils.normalizeStation('ARTLENBURG-ELK', 'ELBESEITENKANAL');
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
        it('should format hours with leading zeroes', () => {
            const today = new Date();
            today.setHours(8, 12);
            const result = utils.getTimeDesc(today, LOCALE);
            expect(result).to.equal('08:12');
        });

        it('should format minutes with leading zeroes', () => {
            const today = new Date();
            today.setHours(12, 1);
            const result = utils.getTimeDesc(today, LOCALE);
            expect(result).to.equal('12:01');
        });

        it('should format 24h', () => {
            const today = new Date();
            today.setHours(15, 0);
            const result = utils.getTimeDesc(today, LOCALE);
            expect(result).to.equal('15:00');
        });

        it('should format yesterday', () => {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            yesterday.setHours(8, 1);
            const result = utils.getTimeDesc(yesterday, LOCALE);
            expect(result).to.equal('gestern 08:01');
        });

        it('should format yesterday on Jan 1st', () => {
            const result = utils.getTimeDesc(
                new Date('December 31, 2018 08:01:00'),
                LOCALE,
                new Date('January 01, 2019'),
            );
            expect(result).to.equal('gestern 08:01');
        });

        it('should format yesterday on Mar 1st', () => {
            const result = utils.getTimeDesc(
                new Date('February 28, 2018 08:02:00'),
                LOCALE,
                new Date('March 01, 2018'),
            );
            expect(result).to.equal('gestern 08:02');
        });

        it('should format the day before yesterday', () => {
            const dby = new Date();
            dby.setDate(dby.getDate() - 2);
            dby.setHours(8, 1);
            const result = utils.getTimeDesc(dby, LOCALE);
            expect(result).to.equal(dby.toLocaleString(LOCALE));
        });
    });
});
