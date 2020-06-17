try {
  module.exports = require('./node')
} catch (e) {
  module.exports = require('./js')
}
