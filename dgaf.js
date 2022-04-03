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
    } else if (isLeftSideOfAugmentedAssignment(node)) {
        const identifier = node.text
        const replaceWith = `if (typeof ${identifier} !== "undefined") {${identifier}`
        addReplacement(node.startIndex, node.endIndex, replaceWith)
        addReplacement(node.parent.endIndex, node.parent.endIndex, '}')
    }

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
            }
            processReferenceNode(node.child(0))
        }
    }

    function isAlreadyInScope(identifier) {
        let current = node
        while (current.parent) {
            if (isFunctionBody(current)) {
                if (identifierInParameters(current.previousSibling)) return true
            } else if (isArrowFunctionBody(current)) {
                if (identifierInParameters(current.previousSibling.previousSibling)) return true
            } else if (isForBody(current)) {
                if (isDesiredIdentifier(current.parent.firstNamedChild)) return true
            } else if (hasDeclarationOnTheSameLevel(current)) {
                return true
            }

            current = current.parent
        }

        function hasDeclarationOnTheSameLevel(node) {
            let current = node
            while (current.previousSibling) {
                current = current.previousSibling
                if (current.type === 'expression_statement') {
                    if (current.firstChild?.type === 'assignment_expression' && isDesiredIdentifier(current.firstChild.firstChild)) return true
                } else if (current.type === 'variable_declaration' || current.type === 'lexical_declaration') {
                    if (current.firstNamedChild?.type === 'variable_declarator' && isDesiredIdentifier(current.firstNamedChild.firstChild)) return true
                } else if (current.type === 'function_declaration') {
                    if (isDesiredIdentifier(current.firstNamedChild)) return true
                }
            }
            current = node
            do {
                if (current.type === 'function_declaration') {
                    if (isDesiredIdentifier(current.firstNamedChild)) return true
                }
                current = current.nextSibling
            } while (current)
        }

        function identifierInParameters(parameters) {
            if (parameters) {
                if (isDesiredIdentifier(parameters)) {
                    return true
                } else if (parameters.type === 'formal_parameters') {
                    for (const parameter of parameters.namedChildren) {
                        if (isDesiredIdentifier(parameter)) return true
                        if (parameter.type === 'assignment_pattern' && isDesiredIdentifier(parameter.firstChild)) return true
                    }
                }
            }
        }

        function isDesiredIdentifier(node) {
            return node && node.type === 'identifier' && node.text === identifier
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
        || isRightSideOfAssignmentPattern(node)
}

function isRightSideOfAssignmentPattern(node) {
    return node.parent?.type === 'assignment_pattern' && node.nextSibling?.type !== '='
}

function isForBody(node) {
    return node.parent?.type === 'for_in_statement' && node.previousSibling?.type === ')'
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
        callback(cursor.currentNode)
        if (goDown()) {
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
    let sb = ''
    if (node.hasError()) sb += 'E~'
    if (node.isMissing()) sb += 'M~'
    sb += node.type
    if (node.isNamed) sb += ': ' + node.text
    return sb
}
