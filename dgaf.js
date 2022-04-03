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
                || node.nextSibling.type === ';'
                || isDotMemeberAccess(node.nextSibling)
                || isBracketMemberAccess(node.nextSibling)
                || isCallArguments(node.nextSibling)
                || isCallArgument(node)
                || isInParentheses(node)
                || isUpdateArgument(node)
                || isBinaryExpressionArgument(node)
                || isOptionalChaining(node.nextSibling)
                || isForEnumerable(node)
                || isArrayElement(node)
                || isPairRightSide(node)
            if (accessIndentifier && isInAccessChain(node)) {
                const identifier = node.text
                const replaceWith = `(typeof ${identifier} === "undefined" ? void 0 : ${identifier})`
                addReplacement(node.startIndex, node.endIndex, replaceWith)
            } else if (isLeftSideOfAugmentedAssignment(node)) {
                const identifier = node.text
                const replaceWith = `if (typeof ${identifier} !== "undefined") {${identifier}`
                addReplacement(node.startIndex, node.endIndex, replaceWith)
                addReplacement(node.parent.endIndex, node.parent.endIndex, '}')
            }
        } else if (isDotMemeberAccess(node) && !isInLeftSideOfAssignment(node.parent)) {
            addReplacement(node.startIndex, node.endIndex, '?.')
        } else if (isBracketMemberAccess(node) && !isInLeftSideOfAssignment(node.parent) && !isOptionalAccess(node)) {
            addReplacement(node.startIndex, node.startIndex, '?.')
        } else if (isCallArguments(node) && !isInErrorBranch(node) && !isOptionalAccess(node)) {
            addReplacement(node.startIndex, node.startIndex, '?.')
        }
    })

    replacements.sort((a, b) => a.from - b.from)

    return replace(text, replacements)

    function addReplacement(from, to, replaceWith) {
        replacements.push({from, to, replaceWith})
    }
}

function isAccessNode(node) {
    return ['member_expression', 'subscript_expression', 'call_expression'].includes(node?.type)
}

function isInAccessChain(node) {
    while (isAccessNode(node.parent)) {
        node = node.parent
    }
    const parentType = node.parent?.type
    return parentType === 'expression_statement'
        || isRightSideOfAssignment(node)
        || isCallArgument(node)
        || isInParentheses(node)
        || isUpdateArgument(node)
        || isRightSideOfAugmentedAssignment(node)
        || isBinaryExpressionArgument(node)
        || isRightSideOfVariableDeclaration(node)
        || isForEnumerable(node)
        || isArrayElement(node)
        || isPairRightSide(node)
}

function isPairRightSide(node) {
    return node.parent?.type === 'pair' && node.previousSibling?.type === ':'
}

function isArrayElement(node) {
    return node.parent?.type === 'array' && node.isNamed
}

function isForEnumerable(node) {
    return node.parent?.type === 'for_in_statement'
        && (node.previousSibling?.type === 'in' || node.previousSibling?.type === 'of')
}

function isRightSideOfVariableDeclaration(node) {
    return node.parent?.type === 'variable_declarator' && node.previousSibling?.type === '='
}

function isBinaryExpressionArgument(node) {
    return node.isNamed && node.parent?.type === 'binary_expression'
}

function isLeftSideOfAugmentedAssignment(node) {
    return node.parent?.type === 'augmented_assignment_expression' && !node.previousSibling
}

function isRightSideOfAugmentedAssignment(node) {
    return node.parent?.type === 'augmented_assignment_expression' && node.previousSibling && !node.previousSibling.isNamed
}

function isUpdateArgument(node) {
    return node.parent?.type === 'update_expression'
}

function isCallArguments(node) {
    return node.type === 'arguments'
        && node.parent?.type === 'call_expression'
}

function isCallArgument(node) {
    return node.parent?.type === 'arguments'
}

function isInParentheses(node) {
    return node.parent?.type === 'parenthesized_expression'
}

function isDotMemeberAccess(node) {
    return node.type === '.'
        && node.parent?.type === 'member_expression'
}

function isOptionalChaining(node) {
    return node.type === '?.' && isAccessNode(node.parent)
}

function isOptionalAccess(node) {
    return node.previousSibling && isOptionalChaining(node.previousSibling)
}

function isBracketMemberAccess(node) {
    return node.type === '['
        && node.parent?.type === 'subscript_expression'
}

function isInLeftSideOfAssignment(node) {
    while (node.parent) {
        if (node.parent.type === 'assignment_expression') {
            return !node.previousSibling
        }
        node = node.parent
    }
    return false
}

function isRightSideOfAssignment(node) {
    return node.parent?.type === 'assignment_expression' && node.nextSibling?.type !== '='
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
        if (!goDown() && !gotoNextBranch()) {
            return
        }
    }

    function goDown() {
        return cursor.gotoFirstChild()
    }

    function gotoNextBranch() {
        while (true) {
            if (cursor.gotoNextSibling()) {
                return true
            }
            if (!cursor.gotoParent()) {
                return false
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
