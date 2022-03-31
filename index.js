#!/usr/bin/env node

const transpile = require('./dgaf').transpile
const fs = require("fs")
const Module = require('module')

if (process.argv.length === 5 && process.argv[2] === '-t' && process.argv[3] === '-c') {
    transpileAndPrint(process.argv[4])
} else if (process.argv.length === 4 && process.argv[2] === '-t') {
    transpileAndPrint(fs.readFileSync(process.argv[3], 'utf8'))
} else if (process.argv.length === 4 && process.argv[2] === '-c') {
    installJSExtension()
    requireFromString(process.argv[3])
} else if (process.argv.length === 3) {
    installJSExtension()
    require(process.argv[2])
} else if (process.argv.length === 2) {
    repl()
} else {
    console.error("Illegal arguments")
}

function repl() {
    console.error("TODO repl")
}

function installJSExtension() {
    Module._extensions['.js'] = (module, filename) => {
        const content = fs.readFileSync(filename, 'utf8')
        compile(module, filename, content)
    }
}

function requireFromString(content) {
    var module = new Module()
    compile(module, '__dgaf-js-fake-path', content)
    return module.exports
}

function compile(module, filename, content) {
    const transpiledContent = transpile(content)
    module._compile(transpiledContent, filename)
}

function transpileAndPrint(code) {
    console.log(transpile(code))
}
