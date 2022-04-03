const transpile = require('..').transpile
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
    it('Should replace binary expression', () => {
        assert.equal(transpile('foo == bar'), '(typeof foo === "undefined" ? void 0 : foo) == (typeof bar === "undefined" ? void 0 : bar)')
        assert.equal(transpile('foo.baz == bar.baz'), '(typeof foo === "undefined" ? void 0 : foo)?.baz == (typeof bar === "undefined" ? void 0 : bar)?.baz')

        assert.equal(transpile('foo + bar'), '(typeof foo === "undefined" ? void 0 : foo) + (typeof bar === "undefined" ? void 0 : bar)')
        assert.equal(transpile('foobar = foo + bar'), 'foobar = (typeof foo === "undefined" ? void 0 : foo) + (typeof bar === "undefined" ? void 0 : bar)')
        assert.equal(transpile('foobaz = foo + bar.baz'), 'foobaz = (typeof foo === "undefined" ? void 0 : foo) + (typeof bar === "undefined" ? void 0 : bar)?.baz')
    })
    it('Should replace declaration', () => {
        assert.equal(transpile('var foo = bar'), 'var foo = (typeof bar === "undefined" ? void 0 : bar)')
        assert.equal(transpile('let foo = bar'), 'let foo = (typeof bar === "undefined" ? void 0 : bar)')
        assert.equal(transpile('const foo = bar'), 'const foo = (typeof bar === "undefined" ? void 0 : bar)')

        assert.equal(transpile('var foo = bar.baz'), 'var foo = (typeof bar === "undefined" ? void 0 : bar)?.baz')
        assert.equal(transpile('let foo = bar.baz'), 'let foo = (typeof bar === "undefined" ? void 0 : bar)?.baz')
        assert.equal(transpile('const foo = bar.baz'), 'const foo = (typeof bar === "undefined" ? void 0 : bar)?.baz')
    })
    it("Shouldn't replace declaration without assignment", () => {
        assert.equal(transpile('var foo'), 'var foo')
        assert.equal(transpile('let foo'), 'let foo')
        assert.equal(transpile('const foo'), 'const foo')
    })
    it('Should replace for enumerable', () => {
        assert.equal(transpile('for(foo in bar){}'), 'for(foo in (typeof bar === "undefined" ? void 0 : bar)){}')
        assert.equal(transpile('for(foo in bar.baz){}'), 'for(foo in (typeof bar === "undefined" ? void 0 : bar)?.baz){}')
    })
    it('Should replace for iterable', () => {
        assert.equal(transpile('for(foo of bar){}'), 'for(foo of (typeof bar === "undefined" ? void 0 : bar)){}')
        assert.equal(transpile('for(foo of bar.baz){}'), 'for(foo of (typeof bar === "undefined" ? void 0 : bar)?.baz){}')
    })
    it('Should replace array elements', () => {
        assert.equal(transpile('[foo]'), '[(typeof foo === "undefined" ? void 0 : foo)]')
        assert.equal(transpile('[foo, bar.baz.foobar]'), '[(typeof foo === "undefined" ? void 0 : foo), (typeof bar === "undefined" ? void 0 : bar)?.baz?.foobar]')

        assert.equal(transpile('[]'), '[]')
        assert.equal(transpile('[1, "2"]'), '[1, "2"]')
    })
    it('Should replace object creation', () => {
        assert.equal(transpile('{foo: bar}'), '{foo: (typeof bar === "undefined" ? void 0 : bar)}')
        assert.equal(transpile('{foo: bar.baz}'), '{foo: (typeof bar === "undefined" ? void 0 : bar)?.baz}')

        assert.equal(transpile('{}'), '{}')
        assert.equal(transpile('{foo: 1}'), '{foo: 1}')
    })
    it("Should replace return value", () => {
        assert.equal(transpile('function foo(){\nreturn bar\n}'), 'function foo(){\nreturn (typeof bar === "undefined" ? void 0 : bar)\n}')
        assert.equal(transpile('function foo(){\nreturn bar.baz\n}'), 'function foo(){\nreturn (typeof bar === "undefined" ? void 0 : bar)?.baz\n}')
    })
    it('Should replace arrow function body', () => {
        assert.equal(transpile('() => bar'), '() => (typeof bar === "undefined" ? void 0 : bar)')
        assert.equal(transpile('() => bar.baz'), '() => (typeof bar === "undefined" ? void 0 : bar)?.baz')

        assert.equal(transpile('foo => bar'), 'foo => (typeof bar === "undefined" ? void 0 : bar)')
        assert.equal(transpile('foo => bar.baz'), 'foo => (typeof bar === "undefined" ? void 0 : bar)?.baz')

        assert.equal(transpile('(foo) => bar'), '(foo) => (typeof bar === "undefined" ? void 0 : bar)')
        assert.equal(transpile('(foo) => bar.baz'), '(foo) => (typeof bar === "undefined" ? void 0 : bar)?.baz')

        assert.equal(transpile('foobar(() => bar())'),
            '(typeof foobar === "undefined" ? void 0 : foobar)?.(() => (typeof bar === "undefined" ? void 0 : bar)?.())')
        assert.equal(transpile('foobar(foo => bar())'),
            '(typeof foobar === "undefined" ? void 0 : foobar)?.(foo => (typeof bar === "undefined" ? void 0 : bar)?.())')
        assert.equal(transpile('foobar((foo) => bar())'),
            '(typeof foobar === "undefined" ? void 0 : foobar)?.((foo) => (typeof bar === "undefined" ? void 0 : bar)?.())')
    })
    it('Should replace assignment pattern', () => {
        assert.equal(transpile('(foo = bar) => bar'), '(foo = (typeof bar === "undefined" ? void 0 : bar)) => (typeof bar === "undefined" ? void 0 : bar)')
        assert.equal(transpile('(foo = bar.baz) => bar.baz'), '(foo = (typeof bar === "undefined" ? void 0 : bar)?.baz) => (typeof bar === "undefined" ? void 0 : bar)?.baz')
    })
    describe("Shouldn't check for undefined reference if the reference is already in scope", () => {
        it('when identifier is function parameter', () => {
            assert.equal(transpile('function foo(bar){\nreturn bar\n}'), 'function foo(bar){\nreturn bar\n}')
            assert.equal(transpile('function foo(bar){\nreturn bar.baz\n}'), 'function foo(bar){\nreturn bar?.baz\n}')

            assert.equal(transpile('foo = bar => bar'), 'foo = bar => bar')
            assert.equal(transpile('foo = bar => bar.baz'), 'foo = bar => bar?.baz')

            assert.equal(transpile('foo = (bar) => bar'), 'foo = (bar) => bar')
            assert.equal(transpile('foo = (bar) => bar.baz'), 'foo = (bar) => bar?.baz')

            assert.equal(transpile('foo = (bar) => {bar}'), 'foo = (bar) => {bar}')
            assert.equal(transpile('foo = (bar) => {bar.baz}'), 'foo = (bar) => {bar?.baz}')

            assert.equal(transpile('foo = (bar) => {bar}'), 'foo = (bar) => {bar}')
            assert.equal(transpile('foo = (bar = baz) => {bar.baz}'), 'foo = (bar = (typeof baz === "undefined" ? void 0 : baz)) => {bar?.baz}')
            assert.equal(transpile('foo = (bar = baz.foo) => {bar.baz}'), 'foo = (bar = (typeof baz === "undefined" ? void 0 : baz)?.foo) => {bar?.baz}')
        })
        it('when identifier is variable', () => {
            assert.equal(transpile('foo = {}; foo'), 'foo = {}; foo')
            assert.equal(transpile('foo = {}; foo.bar'), 'foo = {}; foo?.bar')
            assert.equal(transpile('foo = {}; foo.bar.baz'), 'foo = {}; foo?.bar?.baz')

            assert.equal(transpile('var foo = {}; foo'), 'var foo = {}; foo')
            assert.equal(transpile('var foo = {}; foo.bar'), 'var foo = {}; foo?.bar')
            assert.equal(transpile('var foo = {}; foo.bar.baz'), 'var foo = {}; foo?.bar?.baz')

            assert.equal(transpile('let foo = {}; foo'), 'let foo = {}; foo')
            assert.equal(transpile('let foo = {}; foo.bar'), 'let foo = {}; foo?.bar')
            assert.equal(transpile('let foo = {}; foo.bar.baz'), 'let foo = {}; foo?.bar?.baz')

            assert.equal(transpile('const foo = {}; foo'), 'const foo = {}; foo')
            assert.equal(transpile('const foo = {}; foo.bar'), 'const foo = {}; foo?.bar')
            assert.equal(transpile('const foo = {}; foo.bar.baz'), 'const foo = {}; foo?.bar?.baz')

            assert.equal(transpile('foo = {}\nbaz = foo.baz()'), 'foo = {}\nbaz = foo?.baz?.()')
            assert.equal(transpile('var foo = {}\nvar baz = foo.baz()'), 'var foo = {}\nvar baz = foo?.baz?.()')
            assert.equal(transpile('let foo = {}\nlet baz = foo.baz()'), 'let foo = {}\nlet baz = foo?.baz?.()')
            assert.equal(transpile('const foo = {}\nconst baz = foo.baz()'), 'const foo = {}\nconst baz = foo?.baz?.()')

            assert.equal(transpile('foo = {}\nreturn foo.bar()'), 'foo = {}\nreturn foo?.bar?.()')
            assert.equal(transpile('var foo = {}\nreturn foo.bar()'), 'var foo = {}\nreturn foo?.bar?.()')
            assert.equal(transpile('let foo = {}\nreturn foo.bar()'), 'let foo = {}\nreturn foo?.bar?.()')
            assert.equal(transpile('const foo = {}\nreturn foo.bar()'), 'const foo = {}\nreturn foo?.bar?.()')

            assert.equal(transpile('foo = {}\nwhile(foo.bar){foo.bar()}'), 'foo = {}\nwhile(foo?.bar){foo?.bar?.()}')
            assert.equal(transpile('foo = {}\nif(foo.bar){foo.bar()}'), 'foo = {}\nif(foo?.bar){foo?.bar?.()}')
        })
        it('when identifier is function', () => {
            assert.equal(transpile('function foo(){}; foo()'), 'function foo(){}; foo?.()')
            assert.equal(transpile('foo(); function foo(){}'), 'foo?.(); function foo(){}')

            assert.equal(transpile('function foo(){return bar()}; function bar(){}'), 'function foo(){return bar?.()}; function bar(){}')

            assert.equal(transpile('function foo(){return foo()}'), 'function foo(){return foo?.()}')
        })
        it('when identifier is for element', () => {
            assert.equal(transpile('for(var foo in {}){foo()}'), 'for(var foo in {}){foo?.()}')
            assert.equal(transpile('for(let foo in {}){foo()}'), 'for(let foo in {}){foo?.()}')
            assert.equal(transpile('for(const foo in {}){foo()}'), 'for(const foo in {}){foo?.()}')

            assert.equal(transpile('for(var foo of []){foo()}'), 'for(var foo of []){foo?.()}')
            assert.equal(transpile('for(let foo of []){foo()}'), 'for(let foo of []){foo?.()}')
            assert.equal(transpile('for(const foo of []){foo()}'), 'for(const foo of []){foo?.()}')

            assert.equal(transpile('for(var foo in {}) foo()'), 'for(var foo in {}) foo?.()')
            assert.equal(transpile('for(let foo in {}) foo()'), 'for(let foo in {}) foo?.()')
            assert.equal(transpile('for(const foo in {}) foo()'), 'for(const foo in {}) foo?.()')

            assert.equal(transpile('for(var foo of []) foo()'), 'for(var foo of []) foo?.()')
            assert.equal(transpile('for(let foo of []) foo()'), 'for(let foo of []) foo?.()')
            assert.equal(transpile('for(const foo of []) foo()'), 'for(const foo of []) foo?.()')
        })
        it('when it is left side of augmented assignment', () => {
            assert.equal(transpile('foo = "";foo += bar'), 'foo = "";foo += (typeof bar === "undefined" ? void 0 : bar)')
            assert.equal(transpile('var foo = "";foo += bar'), 'var foo = "";foo += (typeof bar === "undefined" ? void 0 : bar)')
            assert.equal(transpile('let foo = "";foo += bar'), 'let foo = "";foo += (typeof bar === "undefined" ? void 0 : bar)')
            
            assert.equal(transpile('for (var foo in {}) foo += bar'), 'for (var foo in {}) foo += (typeof bar === "undefined" ? void 0 : bar)')
            assert.equal(transpile('for (let foo in {}) foo += bar'), 'for (let foo in {}) foo += (typeof bar === "undefined" ? void 0 : bar)')
            assert.equal(transpile('for (var foo of []) foo += bar'), 'for (var foo of []) foo += (typeof bar === "undefined" ? void 0 : bar)')
            assert.equal(transpile('for (let foo of []) foo += bar'), 'for (let foo of []) foo += (typeof bar === "undefined" ? void 0 : bar)')
        })
    })
})
