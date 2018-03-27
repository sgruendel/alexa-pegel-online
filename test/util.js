'use strict';

var expect = require('chai').expect;
var util = require('../src/util');

const LOCALE = 'de-DE';

describe('util', () => {
    describe('#getTimeDesc()', () => {
        it('should format hours with leading zeroes', () => {
            var today = new Date();
            today.setHours(8, 12);
            const result = util.getTimeDesc(today, LOCALE);
            expect(result).to.equal('08:12');
        });

        it('should format minutes with leading zeroes', () => {
            var today = new Date();
            today.setHours(12, 1);
            const result = util.getTimeDesc(today, LOCALE);
            expect(result).to.equal('12:01');
        });

        it('should format 24h', () => {
            var today = new Date();
            today.setHours(15, 0);
            const result = util.getTimeDesc(today, LOCALE);
            expect(result).to.equal('15:00');
        });

        it('should format yesterday', () => {
            var yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            yesterday.setHours(8, 1);
            const result = util.getTimeDesc(yesterday, LOCALE);
            expect(result).to.equal('gestern 08:01');
        });

        it('should format the day before yesterday', () => {
            var dby = new Date();
            dby.setDate(dby.getDate() - 2);
            dby.setHours(8, 1);
            const result = util.getTimeDesc(dby, LOCALE);
            expect(result).to.equal(dby.toLocaleString(LOCALE));
        });
    });
});
