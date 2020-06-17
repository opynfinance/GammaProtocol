const { showInvisibles, generateDifferences } = require('prettier-linter-helpers')
const { INSERT, DELETE, REPLACE } = generateDifferences

const getLocFromIndex = (text, index) => {
  let line = 1
  let column = 0
  let i = 0
  while (i < index) {
    if (text[i] === '\n') {
      line++
      column = 0
    } else {
      column++
    }
    i++
  }

  return { line, column }
}

class PrettierChecker {
  constructor(reporter, config, inputSrc, fileName) {
    this.prettier = null
    this.ruleId = 'prettier'
    this.reporter = reporter
    this.config = config
    this.inputSrc = inputSrc
    this.fileName = fileName
  }

  enterSourceUnit() {
    try {
      // Check for optional dependencies with the try catch
      // Prettier is expensive to load, so only load it if needed.
      if (!this.prettier) {
        this.prettier = require('prettier')
      }

      const filepath = this.fileName

      const prettierRcOptions = this.prettier.resolveConfig.sync(filepath, {
        editorconfig: true
      })

      const prettierOptions = Object.assign({}, prettierRcOptions, {
        filepath,
        plugins: ['prettier-plugin-solidity']
      })

      const formatted = this.prettier.format(this.inputSrc, prettierOptions)

      const differences = generateDifferences(this.inputSrc, formatted)

      differences.forEach(difference => {
        let loc = null
        switch (difference.operation) {
          case INSERT:
            loc = getLocFromIndex(this.inputSrc, difference.offset)
            this.errorAt(loc.line, loc.column, `Insert ${showInvisibles(difference.insertText)}`)
            break
          case DELETE:
            loc = getLocFromIndex(this.inputSrc, difference.offset)
            this.errorAt(loc.line, loc.column, `Delete ${showInvisibles(difference.deleteText)}`)
            break
          case REPLACE:
            loc = getLocFromIndex(this.inputSrc, difference.offset)
            this.errorAt(
              loc.line,
              loc.column,
              `Replace ${showInvisibles(difference.deleteText)} with ${showInvisibles(
                difference.insertText
              )}`
            )
            break
          default:
          // A switch must have a default
        }
      })
    } catch (e) {
      console.error(e)
      process.exit(1)
    }
  }

  errorAt(line, column, message) {
    this.reporter.errorAt(line, column, this.ruleId, message)
  }
}

module.exports = [PrettierChecker]
