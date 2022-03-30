#!/usr/bin/env node

const transpile = require('./dgaf').transpile
const fs = require("fs")

if (process.argv.length === 5 && process.argv[2] === '-t' && process.argv[3] === '-c') {
    transpileText(process.argv[4])
} else if (process.argv.length === 4 && process.argv[2] === '-t') {
    readFile(process.argv[3], transpileText)
} else if (process.argv.length === 4 && process.argv[2] === '-c') {
    interpretText(process.argv[3])
} else if (process.argv.length === 3) {
    readFile(process.argv[2], interpretText)
} else if (process.argv.length === 2) {
    repl()
} else {
    console.error("Illegal arguments")
}

function repl() {
    console.error("TODO repl")
}

function interpretText(text) {
    console.error("TODO interpretText: " + text)
}

function transpileText(text) {
    const transpiledText = transpile(text)
    console.log(transpiledText)
}

function readFile(path, callback) {
    fs.readFile(path, 'utf8', (data, error) => {
        if (error) {
            console.error(error)
            return
        }
        callback(data)
    })
}
