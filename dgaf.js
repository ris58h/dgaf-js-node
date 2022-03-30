import Parser from 'tree-sitter'
import JavaScript from 'tree-sitter-javascript'

export function transpile(text) {
    const parser = new Parser()
    parser.setLanguage(JavaScript)

    const tree = parser.parse(text)

    const dotIndexes = []
    walkTree(tree, node => {
        if (node.type === '.' && node?.parent.type === 'member_expression') {
            dotIndexes.push(node.startIndex)
        }
    })

    dotIndexes.sort((a, b) => a - b)

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
