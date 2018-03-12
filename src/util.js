'use strict';

function pad(minutes) {
    return (minutes < 10) ? ('0' + minutes) : minutes;
}

var exports = module.exports = {};

exports.getTimeDesc = function(date) {
    const today = new Date();
    if (date.getDate() === today.getDate()) {
        // today, use "hours:minutes"
        return pad(date.getHours()) + ':' + pad(date.getMinutes());
    } else if ((date.getDate() + 1) === today.getDate()) {
        // yesterday, use "yesterday hours:minutes"
        return 'gestern ' + pad(date.getHours()) + ':' + pad(date.getMinutes());
    }
    return date.toLocaleString('de-DE');
};
