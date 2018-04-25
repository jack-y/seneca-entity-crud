/* Copyright (c) 2018 e-soa Jacques Desodt, MIT License */
'use strict'

/* Prerequisites */
const processThen = require('../../process/then')
const testFunctions = require('../functions')

/* Test prerequisites */
const Code = require('code')
const Lab = require('lab', {timeout: testFunctions.timeout})
const lab = (exports.lab = Lab.script())
const after = lab.after
const describe = lab.describe
const it = lab.it
const expect = Code.expect

/* Backups functions before mock */
const backups = new Map()
backups.set(processThen, [
  ['runAction', processThen.runAction.bind({})]
])

describe('then thenForEntityAsync', function () {
  after((done) => {
    /* Restores the origin functions */
    for (var [key, values] of backups) {
      values.forEach(function (item) { key[item[0]] = item[1] })
    }
    done()
  })
  /* Bad arguments */
  it('no args', function (fin) {
    /* Fires the test */
    processThen.thenForEntityAsync()
    .then(function (result) {
      /* Checks the result */
      expect(result.length).to.equal(0)
      fin()
    })
  })
  it('no entity', function (fin) {
    /* Fires the test */
    processThen.thenForEntityAsync(null, null, getThenArgsDefault())
    .then(function (result) {
      /* Checks the result */
      expect(result.length).to.equal(0)
      fin()
    })
  })
  it('no then arguments', function (fin) {
    /* Fires the test */
    processThen.thenForEntityAsync(null, getEntity(), null)
    .then(function (result) {
      /* Checks the result */
      expect(result.length).to.equal(0)
      fin()
    })
  })
  it('no then action', function (fin) {
    /* Fires the test */
    processThen.thenForEntityAsync(null, getEntity(), {actions: []})
    .then(function (result) {
      /* Checks the result */
      expect(result.length).to.equal(0)
      fin()
    })
  })
  /* run action on error */
  it('then action on error', function (fin) {
    /* Initializes */
    var msg = 'Oops, an action error!'
    /* Mocks the run actions */
    mockRunActionError(msg)
    /* Fires the test */
    processThen.thenForEntityAsync(null, getEntity(), getThenArgsDefault())
    .catch(function (err) {
      /* Checks the result */
      expect(err.message).to.equal(msg)
      fin()
    })
  })
  /* run action OK */
  it('then action OK', function (fin) {
    /* Initializes */
    var expected = getThenArgsDefault().actions.length
    /* Mocks the run actions */
    var thenName = 'jobi'
    mockRunActionOk(thenName)
    /* Fires the test */
    processThen.thenForEntityAsync(null, getEntity(), getThenArgsDefault())
    .then(function (result) {
      /* Checks the result */
      expect(result.length).to.equal(expected)
      fin()
    })
  })
})

/* ---------- MOCKS ---------- */

function mockRunActionError (msg) {
  processThen.runAction = function (act, entity, action) {
    return new Promise(function (resolve, reject) {
      return reject(new Error(msg))
    })
  }
  return false
}

function mockRunActionOk (thenName) {
  processThen.runAction = function (act, entity, action) {
    return new Promise(function (resolve, reject) {
      return resolve({ success: true, name: thenName })
    })
  }
  return false
}

/* ---------- FUNCTIONS ---------- */

function getEntity () {
  return {id: 'i1', name: 'John Doo'}
}

function getThenArgsDefault () {
  return {
    actions: [
      { role: 'r1', cmd: 'c1' },
      { role: 'r2', cmd: 'c2' }
    ]
  }
}
