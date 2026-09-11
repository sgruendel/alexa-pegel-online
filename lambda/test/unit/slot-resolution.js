import { expect } from 'chai';
import { resolveSlot } from '../../slot-resolution.js';
import { resolvedSlot } from '../helpers/alexa.js';

describe('slot resolution', () => {
    for (const spoken of ['Main', 'main', ' MAIN ']) {
        it(`finds the exact water match for ${JSON.stringify(spoken)} regardless of candidate order`, () => {
            const water = resolvedSlot('water', spoken, [{ name: 'Main-Donau-Kanal' }, { name: 'Main' }]);
            expect(resolveSlot(water)).to.deep.equal({ status: 'matched', value: { name: 'Main' } });
        });
    }
    it('keeps the ID paired with the selected station', () => {
        const station = resolvedSlot('station', 'würzburg', [{ name: 'Other', id: 'other' }, { name: 'Würzburg', id: 'correct' }]);
        expect(resolveSlot(station, { requireId: true }).value.id).to.equal('correct');
    });
    it('accepts a synonym with one match', () => {
        expect(resolveSlot(resolvedSlot('station', 'loreley', [{ name: 'Sankt Goar', id: 'goar' }])).value.name).to.equal('Sankt Goar');
    });
    it('preserves ambiguity', () => {
        expect(resolveSlot(resolvedSlot('water', 'kanal', [{ name: 'A' }, { name: 'B' }])).status).to.equal('ambiguous');
    });
    it('handles missing slots and missing spoken values', () => {
        expect(resolveSlot(undefined).status).to.equal('missing');
        expect(resolveSlot({}).status).to.equal('missing');
    });
    it('handles missing resolution data', () => {
        expect(resolveSlot({ value: 'main' }).status).to.equal('error');
    });
    it('handles success without values', () => {
        expect(resolveSlot(resolvedSlot('water', 'main', [])).status).to.equal('error');
    });
    it('rejects station matches without IDs', () => {
        expect(resolveSlot(resolvedSlot('station', 'main', [{ name: 'Main' }]), { requireId: true }).status).to.equal('error');
    });
    it('looks beyond an unsuccessful authority', () => {
        const slot = resolvedSlot('water', 'main', [{ name: 'Main' }]);
        slot.resolutions.resolutionsPerAuthority.unshift({ status: { code: 'ER_ERROR_TIMEOUT' } });
        expect(resolveSlot(slot).value.name).to.equal('Main');
    });
});
