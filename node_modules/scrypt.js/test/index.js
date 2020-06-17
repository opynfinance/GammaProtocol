const tape = require('tape')
const scrypt = require('../index')
const scryptJS = require('../js')
const scryptNode = require('../node')

tape('Auto-detected', function (t) {
  t.test('basic', function (st) {
    st.deepEqual(scrypt(Buffer.from('key'), Buffer.from('salt'), 1024, 256, 4, 16), Buffer.from('fcc68e0894929cb761fadd8990e0946b', 'hex'))
    st.end()
  })
})

tape('Javascript', function (t) {
  t.test('basic', function (st) {
    st.deepEqual(scryptJS(Buffer.from('key'), Buffer.from('salt'), 1024, 256, 4, 16), Buffer.from('fcc68e0894929cb761fadd8990e0946b', 'hex'))
    st.end()
  })
})

tape('Node', function (t) {
  t.test('basic', function (st) {
    st.deepEqual(scryptNode(Buffer.from('key'), Buffer.from('salt'), 1024, 256, 4, 16), Buffer.from('fcc68e0894929cb761fadd8990e0946b', 'hex'))
    st.end()
  })
})
