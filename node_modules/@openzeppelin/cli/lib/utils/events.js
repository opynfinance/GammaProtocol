"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const upgrades_1 = require("@openzeppelin/upgrades");
function describeEvents(events) {
    let description = '';
    Object.values(events)
        .filter(({ event }) => event)
        .forEach(({ event, returnValues }) => {
        const emitted = Object.keys(returnValues)
            .filter(key => !isNaN(Number(key)))
            .map(key => returnValues[key]);
        if (emitted.length !== 0)
            description = description.concat(`\n - ${event}(${emitted.join(', ')})`);
    });
    if (description) {
        upgrades_1.Loggy.noSpin(__filename, 'describe', 'describe-events', `Events emitted: ${description}`);
    }
}
exports.describeEvents = describeEvents;
//# sourceMappingURL=events.js.map