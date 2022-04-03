const transpile = require('../dgaf').transpile
const assert = require('assert').strict

describe('transpile', () => {
    it('Should replace simple reference access', () => {
        assert.equal(transpile('foo'), '(typeof foo === "undefined" ? void 0 : foo)')
        assert.equal(transpile('foo;'), '(typeof foo === "undefined" ? void 0 : foo);')
    })
    it("Shouldn't replace simple reference access in the left side of assignment", () => {
        assert.equal(transpile('foo = bar'), 'foo = (typeof bar === "undefined" ? void 0 : bar)')
        assert.equal(transpile('foo = bar;'), 'foo = (typeof bar === "undefined" ? void 0 : bar);')
    })
    it("Optional chaining", () => {
        assert.equal(transpile('foo?.bar'), '(typeof foo === "undefined" ? void 0 : foo)?.bar')
        assert.equal(transpile('foo?.[bar]'), '(typeof foo === "undefined" ? void 0 : foo)?.[bar]')
        assert.equal(transpile('foo?.()'), '(typeof foo === "undefined" ? void 0 : foo)?.()')
        assert.equal(transpile('foo?.bar.baz'), '(typeof foo === "undefined" ? void 0 : foo)?.bar?.baz')
        assert.equal(transpile('foo?.bar?.baz'), '(typeof foo === "undefined" ? void 0 : foo)?.bar?.baz')
        assert.equal(transpile('foo?.bar[baz]'), '(typeof foo === "undefined" ? void 0 : foo)?.bar?.[baz]')
        assert.equal(transpile('foo?.bar?.[baz]'), '(typeof foo === "undefined" ? void 0 : foo)?.bar?.[baz]')
        assert.equal(transpile('foo?.bar()'), '(typeof foo === "undefined" ? void 0 : foo)?.bar?.()')
        assert.equal(transpile('foo?.bar?.()'), '(typeof foo === "undefined" ? void 0 : foo)?.bar?.()')
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
        assert.equal(transpile('foo = []'), 'foo = []')
        assert.equal(transpile('foo = ["bar"]'), 'foo = ["bar"]')
        // assert.equal(transpile('foo = {[bar] = "baz"}'), 'foo = {[bar] = "baz"}') //TODO 
    })
    it('Should replace function call', () => {
        assert.equal(transpile('foo()'), '(typeof foo === "undefined" ? void 0 : foo)?.()')
        assert.equal(transpile('foo()()'), '(typeof foo === "undefined" ? void 0 : foo)?.()?.()')
    })
    it("Shouldn't replace function call in the left side of assignment (despite it's illegal)", () => {
        assert.equal(transpile('foo() = "bar"'), 'foo() = "bar"')
        assert.equal(transpile('foo()() = "bar"'), 'foo()() = "bar"')
    })
    it("Should replace multiple access expressions", () => {
        assert.equal(transpile('foo.bar.baz[777]()'), '(typeof foo === "undefined" ? void 0 : foo)?.bar?.baz?.[777]?.()')
    })
    it("Shouldn't replace multiple different assignments", () => {
        assert.equal(transpile('foo = bar.baz = bar["baz"] = 777'), 'foo = bar.baz = bar["baz"] = 777')
    })
    it('Should replace call arguments', () => {
        assert.equal(transpile('foo(bar)'),
            '(typeof foo === "undefined" ? void 0 : foo)?.((typeof bar === "undefined" ? void 0 : bar))')
        assert.equal(transpile('foo(bar, baz)'),
            '(typeof foo === "undefined" ? void 0 : foo)?.((typeof bar === "undefined" ? void 0 : bar), (typeof baz === "undefined" ? void 0 : baz))')
        assert.equal(transpile('foo(777, bar.baz)'),
            '(typeof foo === "undefined" ? void 0 : foo)?.(777, (typeof bar === "undefined" ? void 0 : bar)?.baz)')
        assert.equal(transpile('foo(777, bar.baz, bar["baz"])'),
            '(typeof foo === "undefined" ? void 0 : foo)?.(777, (typeof bar === "undefined" ? void 0 : bar)?.baz, (typeof bar === "undefined" ? void 0 : bar)?.["baz"])')
            assert.equal(transpile('foo(777, bar(baz["foobar"]))'),
            '(typeof foo === "undefined" ? void 0 : foo)?.(777, (typeof bar === "undefined" ? void 0 : bar)?.((typeof baz === "undefined" ? void 0 : baz)?.["foobar"]))')
    })
    it('Should replace if expression', () => {
        assert.equal(transpile('if (foo) 777'), 'if ((typeof foo === "undefined" ? void 0 : foo)) 777')
        assert.equal(transpile('if (foo.bar) 777'), 'if ((typeof foo === "undefined" ? void 0 : foo)?.bar) 777')
        assert.equal(transpile('if (foo().bar[baz]) 777'), 'if ((typeof foo === "undefined" ? void 0 : foo)?.()?.bar?.[baz]) 777')
    })
    it('Should replace while expression', () => {
        assert.equal(transpile('while (foo) 777'), 'while ((typeof foo === "undefined" ? void 0 : foo)) 777')
        assert.equal(transpile('while (foo.bar) 777'), 'while ((typeof foo === "undefined" ? void 0 : foo)?.bar) 777')
        assert.equal(transpile('while (foo().bar[baz]) 777'), 'while ((typeof foo === "undefined" ? void 0 : foo)?.()?.bar?.[baz]) 777')
    })
    it('Should replace parenthesized expression', () => {
        assert.equal(transpile('(foo)'), '((typeof foo === "undefined" ? void 0 : foo))')
        assert.equal(transpile('(((foo)))'), '((((typeof foo === "undefined" ? void 0 : foo))))')
        assert.equal(transpile('(foo.bar)'), '((typeof foo === "undefined" ? void 0 : foo)?.bar)')
        assert.equal(transpile('(foo().bar[baz])'), '((typeof foo === "undefined" ? void 0 : foo)?.()?.bar?.[baz])')
    })
    it('Should replace increment/decrement', () => {
        assert.equal(transpile('foo++'), '(typeof foo === "undefined" ? void 0 : foo)++')
        assert.equal(transpile('foo.bar++'), '(typeof foo === "undefined" ? void 0 : foo)?.bar++')

        assert.equal(transpile('++foo'), '++(typeof foo === "undefined" ? void 0 : foo)')
        assert.equal(transpile('++foo.bar'), '++(typeof foo === "undefined" ? void 0 : foo)?.bar')

        assert.equal(transpile('foo--'), '(typeof foo === "undefined" ? void 0 : foo)--')
        assert.equal(transpile('foo.bar--'), '(typeof foo === "undefined" ? void 0 : foo)?.bar--')

        assert.equal(transpile('--foo'), '--(typeof foo === "undefined" ? void 0 : foo)')
        assert.equal(transpile('--foo.bar'), '--(typeof foo === "undefined" ? void 0 : foo)?.bar')
    })
    it('Should replace augmented assignment', () => {
        assert.equal(transpile('foo += bar'), 'if (typeof foo !== "undefined") {foo += (typeof bar === "undefined" ? void 0 : bar)}')
        assert.equal(transpile('foo += bar.baz[777]'), 'if (typeof foo !== "undefined") {foo += (typeof bar === "undefined" ? void 0 : bar)?.baz?.[777]}')

        assert.equal(transpile('foo -= bar'), 'if (typeof foo !== "undefined") {foo -= (typeof bar === "undefined" ? void 0 : bar)}')
        assert.equal(transpile('foo -= bar.baz[777]'), 'if (typeof foo !== "undefined") {foo -= (typeof bar === "undefined" ? void 0 : bar)?.baz?.[777]}')

        assert.equal(transpile('foo >>= bar'), 'if (typeof foo !== "undefined") {foo >>= (typeof bar === "undefined" ? void 0 : bar)}')
        assert.equal(transpile('foo >>= bar.baz[777]'), 'if (typeof foo !== "undefined") {foo >>= (typeof bar === "undefined" ? void 0 : bar)?.baz?.[777]}')
    })
    it('Should replace euqal expression', () => {
        assert.equal(transpile('foo == bar'), '(typeof foo === "undefined" ? void 0 : foo) == (typeof bar === "undefined" ? void 0 : bar)')
        assert.equal(transpile('foo.baz == bar.baz'), '(typeof foo === "undefined" ? void 0 : foo)?.baz == (typeof bar === "undefined" ? void 0 : bar)?.baz')
    })
})
