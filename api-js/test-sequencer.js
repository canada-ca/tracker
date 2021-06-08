const Sequencer = require('@jest/test-sequencer').default

class CustomSequencer extends Sequencer {
  sort(tests) {
    const copyTests = Array.from(tests)
    
    const rtnTests = []

    const re = /.*-scan-data.*/

    copyTests.forEach(test => {
      if (test.path.match(re)) {
        rtnTests.push(test)
      }
    })

    copyTests.filter(test => !test.path.match(re))

    rtnTests.append(...copyTests)

    return rtnTests
  }
}

module.exports = CustomSequencer
