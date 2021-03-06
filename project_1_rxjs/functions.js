const fs = require('fs')
const path = require('path')
const { Observable } = require('rxjs')

function createPipeableOperator(operatorFn) {
  return function (source) {
    return new Observable(subscriber => {
      const sub = operatorFn(subscriber)
      source.subscribe({
        next: sub.next,
        error: sub.error || (errorMsg => subscriber.error(errorMsg)),
        complete: sub.complete || (() => subscriber.complete()),
      })
    })
  }
}

function readDir(dirPath) {
  return new Observable(subscriber => {
    try {
      fs.readdirSync(dirPath).forEach(filename => {
        subscriber.next(path.join(dirPath, filename))
      })
      subscriber.complete()
    } catch (exception) {
      subscriber.error(exception)
    }
  })
}

function endingWith(pattern) {
  return createPipeableOperator(subscriber => ({
    next(element) {
      if (element.endsWith(pattern)) {
        subscriber.next(element)
      }
    }
  }))
}

function readFile() {
  return createPipeableOperator(subscriber => ({
    next(fullPath) {
      try {
        const content = fs.readFileSync(fullPath)
        subscriber.next(content.toString())
      } catch (exception) {
        subscriber.error(exception)
      }
    }
  }))
}

function writeFile(filename) {
  return function (content) {
    return new Promise((resolve, reject) => {
      try {
        fs.writeFileSync(filename, content)
        resolve(`Result saved in file ${filename}`)
      } catch (exception) {
        reject(exception)
      }
    })
  }
}

function removeEmpty() {
  return createPipeableOperator(subscriber => ({
    next(element) {
      if (element.trim()) {
        subscriber.next(element)
      }
    }
  }))
}

function removeElementsWithPattern(pattern) {
  return createPipeableOperator(subscriber => ({
    next(element) {
      if (!element.includes(pattern)) {
        subscriber.next(element)
      }
    }
  }))
}

function removeNumericElements(elements) {
  return createPipeableOperator(subscriber => ({
    next(element) {
      if (isNaN(element)) {
        subscriber.next(element)
      }
    }
  }))
}

function removeSymbols(symbols) {
  return createPipeableOperator(subscriber => ({
    next(element) {
      subscriber.next(
        symbols.reduce((accumulator, symbol) => {
          return accumulator.split(symbol).join(' ')
        }, element)
      )
    }
  }))
}

function removeTags() {
  return createPipeableOperator(subscriber => ({
    next(element) {
      subscriber.next(element.split(/<.+?>/ig).join(' '))
    }
  }))
}

function splitBy(symbol) {
  return createPipeableOperator(subscriber => ({
    next(element) {
      element.split(symbol).forEach(part => {
        subscriber.next(part)
      })
    }
  }))
}

module.exports = {
  readDir,
  endingWith,
  readFile,
  writeFile,
  removeEmpty,
  removeElementsWithPattern,
  removeNumericElements,
  removeSymbols,
  removeTags,
  splitBy
}
