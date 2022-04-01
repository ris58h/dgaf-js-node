#!/usr/bin/env node

const transpile = require('../dgaf').transpile
const fs = require("fs")
const Module = require('module')

if (process.argv.length === 4 && process.argv[2] === '-c') {
    installJSExtension()
    requireFromString(process.argv[3])
} else if (process.argv.length === 3) {
    installJSExtension()
    require(process.argv[2])
} else if (process.argv.length === 2) {
    installJSExtension()
    requireFromString(fs.readFileSync(process.stdin.fd, 'utf8'))
} else {
    console.error("Illegal arguments")
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
