import { transpile } from '../dgaf.js';
import { strict as assert } from 'assert';

describe('transpile', () => {
    it('Should replace member access', () => {
        assert.equal(transpile('x.a'), 'x?.a')
        assert.equal(transpile('x.a.b.c'), 'x?.a?.b?.c')
        assert.equal(transpile('x.a().b?.c'), 'x?.a()?.b?.c')
    })
    it('Should preserve indentation', () => {
        const input = `if (x.a) {
            console.log(x.a)
        }`
        const expectedOutput = `if (x?.a) {
            console?.log(x?.a)
        }`
        assert.equal(transpile(input), expectedOutput)
    })
    it("Shouldn't replace member access in left-side of assignment", () => {
        assert.equal(transpile('x.a = y'), 'x.a = y')
        assert.equal(transpile('x.a = y.b'), 'x.a = y?.b')
    })
    it.only('Should replace function call', () => {
        assert.equal(transpile('foo()'), 'foo?.()')
        assert.equal(transpile('foo.bar()'), 'foo?.bar?.()')
    })
})
