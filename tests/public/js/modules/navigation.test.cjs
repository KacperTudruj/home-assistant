const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

test('adds a styled Car Log breadcrumb preserving the selected car', () => {
    //Given
    const inserted = [];
    const nav = { lastElementChild: {}, insertBefore(node) { inserted.push(node); } };
    const root = { innerHTML: '', querySelector: () => nav };
    const context = vm.createContext({ URLSearchParams, location: { search: '?carId=car%2Fone' }, document: {
        body: { dataset: { page: 'car-analytics', appTitle: 'Analiza auta' } },
        getElementById: () => root, createElement: () => ({}),
    } });
    vm.runInContext(fs.readFileSync(path.resolve(__dirname, '../../../../public/js/modules/navigation.js'), 'utf8').replace(/^export /gm, ''), context);
    //When
    context.renderAppNav();
    //Then
    assert.equal(inserted[0].textContent, '🚗 Car Log');
    assert.equal(inserted[0].className, 'app-nav-back');
    assert.equal(inserted[0].href, '/car-log?carId=car%2Fone');
    assert.equal(inserted[1].textContent, '/');
});
