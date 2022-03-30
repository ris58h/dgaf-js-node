import { transpile } from '../dgaf.js';
import { strict as assert } from 'assert';

describe('transpile', () => {
    it('Should replace dots', () => {
        assert.equal(transpile('x.a'), 'x?.a')
        assert.equal(transpile('x.a.b.c'), 'x?.a?.b?.c')
        assert.equal(transpile('x.a().b?.c'), 'x?.a()?.b?.c')
    })
    it ('Should preserve indentation', () => {
        const input = `if (x.a) {
            console.log(x.a)
        }`
        const expectedOutput = `if (x?.a) {
            console?.log(x?.a)
        }`
        assert.equal(transpile(input), expectedOutput)
    })
})
