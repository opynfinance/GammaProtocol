"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// TODO: consider "EOF" token
var TokenKind;
(function (TokenKind) {
    TokenKind["Import"] = "import";
    TokenKind["Pragma"] = "pragma";
    TokenKind["Contract"] = "contract";
})(TokenKind = exports.TokenKind || (exports.TokenKind = {}));
function getMetadata(source) {
    return new Parser(source).getMetadata();
}
exports.getMetadata = getMetadata;
class Parser {
    constructor(source) {
        this.source = source;
        this.index = 0;
    }
    getMetadata() {
        const imports = [];
        const solidity = [];
        while (true) {
            const token = this.consume();
            if (!token) {
                break;
            }
            if (token.kind === TokenKind.Import) {
                imports.push(token.value);
            }
            else if (token.kind === TokenKind.Pragma && token.name === 'solidity') {
                solidity.push(token.value);
            }
        }
        return { imports, solidity };
    }
    consume() {
        this.consumeUntilImportOrPragma();
        if (this.index >= this.source.length) {
            return undefined;
        }
        if (this.source.startsWith('import', this.index)) {
            return this.consumeImport();
        }
        if (this.source.startsWith('pragma', this.index)) {
            return this.consumePragma();
        }
        throw new Error(`Unexpected input '${this.source.slice(this.index, this.index + 3)}'`);
    }
    consumeUntilImportOrPragma() {
        while (this.index < this.source.length) {
            if (this.peek('import') || this.peek('pragma')) {
                break;
            }
            if (this.peek('/*')) {
                this.consumeComment();
            }
            else if (this.peek('//')) {
                this.consumeLineComment();
            }
            else if (this.peek(`"`) || this.peek(`'`)) {
                this.consumeString();
            }
            else {
                this.index += 1;
            }
        }
    }
    consumeWhitespace() {
        while (true) {
            if (this.peek('/*')) {
                this.consumeComment();
            }
            else if (this.peek('//')) {
                this.consumeLineComment();
            }
            else if (isWhitespace(this.peekChar())) {
                do {
                    this.index += 1;
                } while (isWhitespace(this.peekChar()));
            }
            else {
                break;
            }
        }
    }
    consumeImport() {
        this.consumeLiteral('import');
        this.consumeWhitespace();
        // import { foo, bar as baz } from 'file';
        if (this.peek('{')) {
            this.consumeBlock('{', '}');
            this.consumeWhitespace();
            this.consumeLiteral('from');
            this.consumeWhitespace();
        }
        // import * as foo from 'file';
        else if (this.peek('*')) {
            this.consumeLiteral('*');
            this.consumeWhitespace();
            this.consumeLiteral('as');
            this.consumeWhitespace();
            this.consumeIdentifier();
            this.consumeWhitespace();
            this.consumeLiteral('from');
            this.consumeWhitespace();
        }
        // Consume filename
        const value = this.consumeString();
        this.consumeWhitespace();
        // import 'file' as foo;
        if (this.peek('as')) {
            this.consumeLiteral('as');
            this.consumeWhitespace();
            this.consumeIdentifier();
            this.consumeWhitespace();
        }
        this.consumeChar(';');
        return {
            kind: TokenKind.Import,
            value,
        };
    }
    consumePragma() {
        this.consumeLiteral('pragma');
        this.consumeWhitespace();
        const name = this.consumeIdentifier();
        this.consumeWhitespace();
        const value = this.consumeUntil(';');
        return {
            kind: TokenKind.Pragma,
            name,
            value,
        };
    }
    consumeString() {
        const delimiter = this.consumeChar();
        if ([`"`, `'`].includes(delimiter)) {
            let value = '';
            let curr;
            while ((curr = this.consumeChar()) !== delimiter) {
                value += curr;
            }
            return value;
        }
        else {
            throw new Error(`Expected string got '${delimiter}'`);
        }
    }
    consumeUntil(delimiter) {
        let value = '';
        while (!this.peek(delimiter)) {
            const char = this.consumeChar();
            value += char;
            if (this.index >= this.source.length) {
                return value;
            }
        }
        this.index += delimiter.length;
        return value;
    }
    consumeLiteral(token) {
        if (this.source.startsWith(token, this.index)) {
            this.index += token.length;
        }
        else {
            throw new Error(`Expected token '${token}' got '${this.source.slice(this.index, this.index + 3)}...'`);
        }
    }
    consumeBlock(open, close) {
        let depth = 0;
        while (this.index <= this.source.length) {
            if (this.peek(open)) {
                depth += 1;
                this.index += 1;
            }
            else if (this.peek(close)) {
                depth -= 1;
                this.index += 1;
                if (depth <= 0) {
                    break;
                }
            }
            else if (this.peek('/*')) {
                this.consumeComment();
            }
            else if (this.peek('//')) {
                this.consumeLineComment();
            }
            else if (this.peek(`"`) || this.peek(`'`)) {
                this.consumeString();
            }
            else {
                this.index += 1;
            }
        }
        if (depth !== 0) {
            throw new Error('Unbalanced delimiters');
        }
    }
    consumeComment() {
        this.consumeLiteral('/*');
        this.consumeUntil('*/');
    }
    consumeLineComment() {
        this.consumeLiteral('//');
        this.consumeUntil('\n');
    }
    consumeChar(expected) {
        const char = this.source[this.index];
        this.index += 1;
        if (expected && char !== expected) {
            throw new Error(`Expected character '${expected}' got '${char}'`);
        }
        return char;
    }
    consumeIdentifier() {
        let value = '';
        while (this.index <= this.source.length) {
            const char = this.consumeChar();
            if (/[a-zA-Z0-9$_]/.test(char)) {
                value += char;
            }
            else {
                this.index -= 1;
                break;
            }
        }
        return value;
    }
    peekChar() {
        return this.source[this.index];
    }
    peek(str) {
        return this.source.startsWith(str, this.index);
    }
}
exports.Parser = Parser;
function isWhitespace(char) {
    return [' ', '\n', '\t', '\r', '\u000c'].includes(char);
}
//# sourceMappingURL=index.js.map