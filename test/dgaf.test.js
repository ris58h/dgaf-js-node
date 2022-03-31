const transpile = require('../dgaf').transpile
const assert = require('assert').strict

describe('transpile', () => {
    it('Should replace dot member access', () => {
        assert.equal(transpile('foo.bar'), 'foo?.bar')
        assert.equal(transpile('foo.bar.baz'), 'foo?.bar?.baz')
    })
    it("Shouldn't replace dot member access in the left side of assignment", () => {
        assert.equal(transpile('foo.bar = baz'), 'foo.bar = baz')
        assert.equal(transpile('foo.bar = baz.bar'), 'foo.bar = baz?.bar')
    })
    it('Should replace bracket member access', () => {
        assert.equal(transpile('foo["bar"]'), 'foo?.["bar"]')
        assert.equal(transpile('foo["bar"][baz][777]'), 'foo?.["bar"]?.[baz]?.[777]')
    })
    it("Shouldn't replace other bracket expressions", () => {
        assert.equal(transpile('var foo = []'), 'var foo = []')
        assert.equal(transpile('var foo = ["bar"]'), 'var foo = ["bar"]')
        // assert.equal(transpile('var foo = {[bar] = "baz"}'), 'var foo = {[bar] = "baz"}') //TODO 
    })
    it("Shouldn't replace bracket member access in the left side of assignment", () => {
        assert.equal(transpile('foo["bar"] = baz'), 'foo["bar"] = baz')
        assert.equal(transpile('foo["bar"] = baz["bar"]'), 'foo["bar"] = baz?.["bar"]')
    })
    it('Should replace function call', () => {
        assert.equal(transpile('foo()'), 'foo?.()')
        assert.equal(transpile('foo()()'), 'foo?.()?.()')
    })
    it('Should preserve indentation', () => {
        const input = `if (foo.bar) {
            console.log(foo.bar)
        }`
        const expectedOutput = `if (foo?.bar) {
            console?.log?.(foo?.bar)
        }`
        assert.equal(transpile(input), expectedOutput)
    })
})
