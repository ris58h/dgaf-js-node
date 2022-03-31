const transpile = require('../dgaf').transpile
const assert = require('assert').strict

describe('transpile', () => {
    it('Should replace dot member access', () => {
        assert.equal(transpile('x.a'), 'x?.a')
        assert.equal(transpile('x.a.b.c'), 'x?.a?.b?.c')
    })
    it("Shouldn't replace dot member access in the left-side of assignment", () => {
        assert.equal(transpile('x.a = y'), 'x.a = y')
        assert.equal(transpile('x.a = y.b'), 'x.a = y?.b')
    })
    it('Should replace bracket member access', () => {
        assert.equal(transpile('foo["bar"]'), 'foo?.["bar"]')
        assert.equal(transpile('foo["bar"]["baz"]'), 'foo?.["bar"]?.["baz"]')
    })
    it("Shouldn't replace bracket member access in the left-side of assignment", () => {
        assert.equal(transpile('x["a"] = y'), 'x["a"] = y')
        assert.equal(transpile('x["a"] = y["b"]'), 'x["a"] = y?.["b"]')
    })
    it('Should replace function call', () => {
        assert.equal(transpile('foo()'), 'foo?.()')
        assert.equal(transpile('foo()()'), 'foo?.()?.()')
    })
    it('Should preserve indentation', () => {
        const input = `if (x.a) {
            console.log(x.a)
        }`
        const expectedOutput = `if (x?.a) {
            console?.log?.(x?.a)
        }`
        assert.equal(transpile(input), expectedOutput)
    })
})
