import { transpileText } from '../index.js';
import { strict as assert } from 'assert';

describe('transpileText', () => {
    it('Should replace dots', () => {
        assert.equal(transpileText('x.a'), 'x?.a')
        assert.equal(transpileText('x.a.b.c'), 'x?.a?.b?.c')
        assert.equal(transpileText('x.a().b?.c'), 'x?.a()?.b?.c')
    })
    it ('Should preserve indentation', () => {
        const input = `if (x.a) {
            console.log(x.a)
        }`
        const expectedOutput = `if (x?.a) {
            console?.log(x?.a)
        }`
        assert.equal(transpileText(input), expectedOutput)
    })
})
