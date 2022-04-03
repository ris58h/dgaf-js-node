const Parser = require('tree-sitter')
const JavaScript = require('tree-sitter-javascript')

exports.transpile = function(text) {
    const parser = new Parser()
    parser.setLanguage(JavaScript)
    const tree = parser.parse(text)
    // printNode(tree.rootNode) //TODO

    const replacements = []
    walkTree(tree, node => processNode(node, replacements))
    replacements.sort((a, b) => a.from - b.from)

    return replace(text, replacements)
}

function processNode(node, replacements) {
    if (isReference(node) && isReferencePlace(node)) {
        processReferenceNode(node)
        return false
    } else if (isLeftSideOfAugmentedAssignment(node)) {
        const identifier = node.text
        const replaceWith = `if (typeof ${identifier} !== "undefined") {${identifier}`
        addReplacement(node.startIndex, node.endIndex, replaceWith)
        addReplacement(node.parent.endIndex, node.parent.endIndex, '}')
    }

    return true

    function processReferenceNode(node) {
        if (node.type === 'identifier') {
            const identifier = node.text
            if (!isAlreadyInScope(identifier)) {
                const replaceWith = `(typeof ${identifier} === "undefined" ? void 0 : ${identifier})`
                addReplacement(node.startIndex, node.endIndex, replaceWith)
            }
        } else if (node.type === 'member_expression') {
            const dotNode = node.child(1)
            addReplacement(dotNode.startIndex, dotNode.endIndex, '?.')
            processReferenceNode(node.child(0))
        } else if (node.type === 'subscript_expression') {
            const secondChild = node.child(1)
            if (secondChild.type === '[') {
                addReplacement(secondChild.startIndex, secondChild.startIndex, '?.')
            }
            processReferenceNode(node.child(0))
        } else if (node.type === 'call_expression') {
            const secondChild = node.child(1)
            if (secondChild.type === 'arguments') {
                addReplacement(secondChild.startIndex, secondChild.startIndex, '?.')
                for (const argument of secondChild.namedChildren) {
                    processReferenceNode(argument)
                }
            }
            processReferenceNode(node.child(0))
        }
    }

    function isAlreadyInScope(identifier) {
        let current = node
        while (current.parent) {
            let parameters
            if (isFunctionBody(current)) {
                parameters = current.previousSibling
            } else if (isArrowFunctionBody(current)) {
                parameters = current.previousSibling.previousSibling
            }
            if (parameters) {
                if (isIdentifier(parameters)) {
                    return true
                } else if (parameters.type === 'formal_parameters') {
                    for (const parameter of parameters.namedChildren) {
                        if (isIdentifier(parameter)) return true
                    }
                }
            }
            current = current.parent
        }
        return false

        function isIdentifier(node) {
            return node.type === 'identifier' && node.text === identifier
        }
    }

    function addReplacement(from, to, replaceWith) {
        replacements.push({from, to, replaceWith})
    }
}

function isReference(node) {
    return node.type === 'identifier'
        || node.type === 'member_expression'
        || node.type === 'subscript_expression'
        || node.type === 'call_expression'
}

function isReferencePlace(node) {
    return node.parent?.type === 'expression_statement'
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
        || isReturnValue(node)
        || isArrowFunctionBody(node)
}

function isFunctionBody(node) {
    return node.type === 'statement_block' && node.parent?.firstChild.type === 'function'
}

function isArrowFunctionBody(node) {
    return node.parent?.type === 'arrow_function' && node.previousSibling?.type === '=>'
}

function isReturnValue(node) {
    return node.parent?.type === 'return_statement' && node.previousSibling?.type === 'return'
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

function isCallArgument(node) {
    return node.parent?.type === 'arguments'
}

function isInParentheses(node) {
    return node.parent?.type === 'parenthesized_expression'
}

function isRightSideOfAssignment(node) {
    return node.parent?.type === 'assignment_expression' && node.nextSibling?.type !== '='
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
        const skipSubtree = !callback(cursor.currentNode)
        if (!skipSubtree && goDown()) {
            continue
        }
        if (!gotoNextBranch()) {
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
function printNode(node, lvl = 0) {
    const prefix = '-'.repeat(lvl)
    console.log(prefix + describeNode(node))
    if (node.children) {
        for (let childNode of node.children) {
            printNode(childNode, lvl + 1)
        }
    }
}
function describeNode(node) {
    var sb = ''
    if (node.hasError()) sb += 'E~'
    if (node.isMissing()) sb += 'M~'
    sb += node.type
    if (node.isNamed) sb += ': ' + node.text
    return sb
}
