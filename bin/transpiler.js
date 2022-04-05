#!/usr/bin/env node

const transpile = require('..').transpile
const fs = require("fs")

if (process.argv.length === 4 && process.argv[2] === '-c') {
    transpileAndPrint(process.argv[3])
} else if (process.argv.length === 3) {
    transpileAndPrint(fs.readFileSync(process.argv[2], 'utf8'))
} else if (process.argv.length === 2) {
    transpileAndPrint(fs.readFileSync(process.stdin.fd, 'utf8'))
} else {
    console.error("Illegal arguments")
    process.exit(1)
}

function transpileAndPrint(code) {
    console.log(transpile(code))
}
