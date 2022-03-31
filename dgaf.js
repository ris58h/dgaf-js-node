const Parser = require('tree-sitter')
const JavaScript = require('tree-sitter-javascript')

exports.transpile = function(text) {
    const parser = new Parser()
    parser.setLanguage(JavaScript)

    const tree = parser.parse(text)
    // printNode(tree.rootNode) //TODO

    const positionsToInsert = []
    walkTree(tree, node => {
        if (isDotMemeberAccess(node)) {
            positionsToInsert.push({
                from: node.startIndex,
                to: node.endIndex
            })
        } else if (isBracketMemberAccess(node)) {
            const bracketIndex = node.startIndex
            positionsToInsert.push({
                from: bracketIndex,
                to: bracketIndex
            })
        } else if (isCallArgumentsNode(node)) {
            const argumentsIndex = node.startIndex
            positionsToInsert.push({
                from: argumentsIndex,
                to: argumentsIndex
            })
        }
    })

    positionsToInsert.sort((a, b) => a.startIndex - b.startIndex)

    return insertOptionalChaining(text, positionsToInsert)
}

function isCallArgumentsNode(node) {
    return node.type === 'arguments'
        && node.parent?.type === 'call_expression'
}

function isDotMemeberAccess(node) {
    return node.type === '.'
        && node.parent?.type === 'member_expression'
        && !isLeftSideOfAssignment(node.parent)
}

function isBracketMemberAccess(node) {
    return node.type === '['
        && node.parent?.type === 'subscript_expression'
        && !isLeftSideOfAssignment(node.parent)
}

function isLeftSideOfAssignment(node) {
    return node.parent?.type === 'assignment_expression' && node.nextSibling?.type === '='
}

function insertOptionalChaining(text, sortedPositions) {
    let sb = ''
    let from = 0
    for (let position of sortedPositions) {
        sb += text.substring(from, position.from)
        sb += '?.'
        from = position.to
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
