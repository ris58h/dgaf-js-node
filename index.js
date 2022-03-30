import { transpile } from './dgaf.js'
import { promises as fs } from 'fs'

if (process.argv.length < 3) {
    console.error('No input file specified')
    process.exit(1)
}

const text = await fs.readFile(process.argv[2], 'utf8')
const transpiledText = transpile(text)
console.log(transpiledText)
