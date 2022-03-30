const Parser = require('tree-sitter')
const JavaScript = require('tree-sitter-javascript')

const parser = new Parser()
parser.setLanguage(JavaScript)

const sourceCode = 'x.a.b?.c\nconsole.log("asd")'
// const sourceCode = 'x.a.b?.c\nreturn\nfunction(){return}()\n{console.log("sd")'
// const tree = parser.parse(sourceCode)
// printTree(tree.rootNode)
// walkTree(tree, printNode)

const dgafText = transpileText(sourceCode)
console.log('RESULT:')
console.log(dgafText)

function transpileText(text) {
    const tree = parser.parse(text)
    const dotIndexes = []
    walkTree(tree, node => {
        if (node.type === '.' && node?.parent.type === 'member_expression') {
            dotIndexes.push(node.startIndex)
        }
    })
    dotIndexes.sort((a, b) => a - b)

    //TODO
    printTree(tree.rootNode)
    console.log(dotIndexes)
    // walkTree(tree, printNode)

    return replaceDots(text, dotIndexes)
}

function replaceDots(text, sortedDotIndexes) {
    let sb = ''
    let from = 0
    for (let dotIndex of sortedDotIndexes) {
        sb += text.substring(from, dotIndex)
        sb += '?.'
        from = dotIndex + 1
    }
    sb += text.substring(from)
    return sb
} 

function walkTree(tree, callback) {
    const cursor = tree.walk()
    while (true) {
        callback(cursor.currentNode)
        if (!goDown() && !goUp()) {
            return
        }
    }

    function goDown() {
        return cursor.gotoFirstChild() || cursor.gotoNextSibling()
    }

    function goUp() {
        while (true) {
            if (!cursor.gotoParent()) {
                return false
            }
            if (cursor.gotoNextSibling()) {
                return true
            }
        }
    }
}

//TODO
function printTree(node, lvl = 0) {
    const prefix = '-'.repeat(lvl)
    printNode(node, prefix)
    if (node.children) {
        for (let childNode of node.children) {
            printTree(childNode, lvl + 1)
        }
    }
}

//TODO
function printNode(node, prefix = '') {
    var sb = prefix
    if (node.hasError()) sb += 'E~'
    if (node.isMissing()) sb += 'M~'
    sb += node.type
    if (node.isNamed) sb += ': ' + node.text
    console.log(sb)
}
