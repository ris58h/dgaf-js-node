const transpile = require('../dgaf').transpile
const assert = require('assert').strict

describe('transpile', () => {
    it('Should replace simple reference access', () => {
        assert.equal(transpile('foo'), '(typeof foo === "undefined" ? void 0 : foo)')
        assert.equal(transpile('foo = bar'), 'foo = (typeof bar === "undefined" ? void 0 : bar)')
    })
    it('Should replace dot member access', () => {
        assert.equal(transpile('foo.bar'), '(typeof foo === "undefined" ? void 0 : foo)?.bar')
        assert.equal(transpile('foo.bar.baz'), '(typeof foo === "undefined" ? void 0 : foo)?.bar?.baz')
    })
    it("Shouldn't replace dot member access in the left side of assignment", () => {
        assert.equal(transpile('foo.bar = baz'), 'foo.bar = (typeof baz === "undefined" ? void 0 : baz)')
        assert.equal(transpile('foo.bar = baz.bar'), 'foo.bar = (typeof baz === "undefined" ? void 0 : baz)?.bar')
        assert.equal(transpile('foo.bar.baz = 777'), 'foo.bar.baz = 777')
    })
    it('Should replace bracket member access', () => {
        assert.equal(transpile('foo["bar"]'), '(typeof foo === "undefined" ? void 0 : foo)?.["bar"]')
        assert.equal(transpile('foo["bar"][baz][777]'), '(typeof foo === "undefined" ? void 0 : foo)?.["bar"]?.[baz]?.[777]')
    })
    it("Shouldn't replace bracket member access in the left side of assignment", () => {
        assert.equal(transpile('foo["bar"] = baz'), 'foo["bar"] = (typeof baz === "undefined" ? void 0 : baz)')
        assert.equal(transpile('foo["bar"] = baz["bar"]'), 'foo["bar"] = (typeof baz === "undefined" ? void 0 : baz)?.["bar"]')
        assert.equal(transpile('foo["bar"]["baz"] = 777'), 'foo["bar"]["baz"] = 777')
    })
    it("Shouldn't replace other bracket expressions", () => {
        assert.equal(transpile('var foo = []'), 'var foo = []')
        assert.equal(transpile('var foo = ["bar"]'), 'var foo = ["bar"]')
        // assert.equal(transpile('var foo = {[bar] = "baz"}'), 'var foo = {[bar] = "baz"}') //TODO 
    })
    it('Should replace function call', () => {
        assert.equal(transpile('foo()'), '(typeof foo === "undefined" ? void 0 : foo)?.()')
        assert.equal(transpile('foo()()'), '(typeof foo === "undefined" ? void 0 : foo)?.()?.()')
    })
    it("Shouldn't replace function call in the left side of assignment (despite it's illegal)", () => {
        assert.equal(transpile('foo() = "bar"'), 'foo() = "bar"')
        assert.equal(transpile('foo()() = "bar"'), 'foo()() = "bar"')
    })
    it("Shouldn't replace  multiple assignments", () => {
        assert.equal(transpile('foo = bar.baz = bar["baz"] = 777'), 'foo = bar.baz = bar["baz"] = 777')
    })
    it('Should preserve indentation', () => {
        const input = `if (foo.bar) {
            console.log(foo.bar)
        }`
        const expectedOutput = `if (foo?.bar) {
            (typeof console === "undefined" ? void 0 : console)?.log?.(foo?.bar)
        }`
        assert.equal(transpile(input), expectedOutput)
    })
})
