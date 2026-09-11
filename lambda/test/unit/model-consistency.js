import { readFileSync } from 'node:fs';
import { expect } from 'chai';

const readJson = file => JSON.parse(readFileSync(new URL(file, import.meta.url), 'utf8'));
const model = readJson('../../../skill-package/interactionModels/custom/de-DE.json');
const variants = readJson('../../stationVariants.json');

describe('interaction model and runtime variants', () => {
    it('keeps every ambiguous station and gauge mapping in sync', () => {
        const types = model.interactionModel.languageModel.types;
        const stations = types.find(type => type.name === 'LIST_OF_STATIONS').values;
        const names = new Set(types.find(type => type.name === 'LIST_OF_VARIANTS').values.map(value => value.name.value));
        const ambiguous = stations.filter(station => station.id.startsWith('*'));
        expect(Object.keys(variants).sort()).to.deep.equal(ambiguous.map(station => station.name.value).sort());
        for (const station of ambiguous) {
            const mappings = variants[station.name.value];
            expect(mappings.length).to.be.above(1);
            const labels = [];
            const ids = [];
            for (const mapping of mappings) {
                const [name, id] = mapping.split(':');
                expect(names.has(name), `${station.name.value}: ${name}`).to.equal(true);
                expect(id).to.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
                labels.push(name);
                ids.push(id);
            }
            expect(new Set(labels).size).to.equal(labels.length);
            expect(new Set(ids).size).to.equal(ids.length);
            expect(ids).to.include(station.id.slice(1));
        }
    });
});
