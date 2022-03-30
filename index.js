#!/usr/bin/env node

const transpile = require('./dgaf').transpile
const fs = require("fs")

if (process.argv.length < 3) {
    console.error('No input file specified')
    process.exit(1)
}

fs.readFile(process.argv[2], 'utf8', (text, error) => {
    if (error) {
        console.error(error)
        return
    }
    const transpiledText = transpile(text)
    console.log(transpiledText)
})
