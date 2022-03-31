const Parser = require('tree-sitter')
const JavaScript = require('tree-sitter-javascript')

exports.transpile = function(text) {
    const parser = new Parser()
    parser.setLanguage(JavaScript)

    const tree = parser.parse(text)
    // printNode(tree.rootNode) //TODO

    const replacements = []
    walkTree(tree, node => {
        if (node.type === 'identifier') {
            const accessIndentifier = !node.nextSibling
                || isDotMemeberAccess(node.nextSibling)
                || isBracketMemberAccess(node.nextSibling)
                || isCallArguments(node.nextSibling)
            if (accessIndentifier && isInAccessChain(node)) {
                const identifier = node.text
                const replaceWith = `(typeof ${identifier} === "undefined" ? void 0 : ${identifier})`
                addReplacement(node.startIndex, node.endIndex, replaceWith)
            }
        } else if (isDotMemeberAccess(node) && !isInLeftSideOfAssignment(node.parent)) {
            addReplacement(node.startIndex, node.endIndex, '?.')
        } else if (isBracketMemberAccess(node) && !isInLeftSideOfAssignment(node.parent)) {
            addReplacement(node.startIndex, node.startIndex, '?.')
        } else if (isCallArguments(node) && !isInErrorBranch(node)) {
            addReplacement(node.startIndex, node.startIndex, '?.')
        }
    })

    replacements.sort((a, b) => a.from - b.from)

    return replace(text, replacements)

    function addReplacement(from, to, replaceWith) {
        replacements.push({from, to, replaceWith})
    }
}

function isInAccessChain(node) {
    while (['member_expression', 'subscript_expression', 'call_expression'].includes(node.parent?.type)) {
        node = node.parent
    }
    const parentType = node.parent?.type
    return parentType === 'expression_statement'
        || (parentType === 'assignment_expression' && node.nextSibling?.type !== '=')
}

function isCallArguments(node) {
    return node.type === 'arguments'
        && node.parent?.type === 'call_expression'
}

function isDotMemeberAccess(node) {
    return node.type === '.'
        && node.parent?.type === 'member_expression'
}

function isBracketMemberAccess(node) {
    return node.type === '['
        && node.parent?.type === 'subscript_expression'
}

function isInLeftSideOfAssignment(node) {
    while (node.parent) {
        if (node.parent.type === 'assignment_expression') {
            return node.nextSibling?.type === '='
        }
        node = node.parent
    }
    return false
}

function isInErrorBranch(node) {
    while (node.parent) {
        if (node.parent.hasError()) {
            return true
        }
        node = node.parent
    }
    return false
}

function replace(text, sortedReplacements) {
    let sb = ''
    let from = 0
    for (let replacement of sortedReplacements) {
        sb += text.substring(from, replacement.from)
        sb += replacement.replaceWith
        from = replacement.to
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
