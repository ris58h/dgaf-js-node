import Parser from 'tree-sitter'
import JavaScript from 'tree-sitter-javascript'

export function transpile(text) {
    const parser = new Parser()
    parser.setLanguage(JavaScript)

    const tree = parser.parse(text)
    // printNode(tree.rootNode) //TODO

    const dotIndexes = []
    walkTree(tree, node => {
        if (isDotNode(node)) {
            dotIndexes.push(node.startIndex)
        }
    })

    dotIndexes.sort((a, b) => a - b)

    return replaceDots(text, dotIndexes)
}

function isDotNode(node) {
    return node.type === '.'
        && node.parent?.type === 'member_expression'
        && !(node.parent.parent?.type === 'assignment_expression' && node.parent.nextSibling?.type === '=')
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
// function printNode(node, lvl = 0) {
//     const prefix = '-'.repeat(lvl)
//     console.log(prefix + describeNode(node))
//     if (node.children) {
//         for (let childNode of node.children) {
//             printNode(childNode, lvl + 1)
//         }
//     }

//     function describeNode(node) {
//         var sb = ''
//         if (node.hasError()) sb += 'E~'
//         if (node.isMissing()) sb += 'M~'
//         sb += node.type
//         if (node.isNamed) sb += ': ' + node.text
//         return sb
//     }
// }
