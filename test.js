'use strict'

let test = require('tape')
let H = require('history')
let Rx = require('rx')
let cycleLocation = require('./')

let makeRouteDriver = cycleLocation.makeRouterDriver


test('matches pathnames with no params', t => {

  t.plan(2)

  let history = H.createMemoryHistory()
  let driver = makeRouteDriver(history)
  let router = driver(new Rx.Subject())

  router.route('/').location$
    .forEach(location => {

      t.equal(location.pathname, '/', '"/" pathname')
    })

  router.route('/test').location$
    .forEach(location =>
      t.equal(location.pathname, '/test', '"/test" pathname'))

  history.push('/test')
})

test('matches nested pathnames with no params', t => {

  t.plan(2)

  let history = H.createMemoryHistory()
  let driver = makeRouteDriver(history)
  let router = driver(new Rx.Subject())

  let nestedRouteOneLevel = router.route('/nested').route('/test')

  nestedRouteOneLevel.location$
    .forEach(location => {

      t.equal(location.pathname, '/nested/test', 'nested pathname at one level with no params')
    })

  nestedRouteOneLevel.route('/more').location$
    .forEach(location =>
      t.equal(location.pathname, '/nested/test/more', 'nested pathname at multiple levels with no params'))

  history.push('/nested/test')
  history.push('/nested/test/more')
})

test('matches pathnames with params', t => {

  t.plan(2)

  let history = H.createMemoryHistory()
  let driver = makeRouteDriver(history)
  let router = driver(new Rx.Subject())

  router.route('/:id').params$
    .forEach(params =>
      t.equal(params.id, '123', 'params id'))

  router.route('/test/:id').params$
    .forEach(params =>
      t.equal(params.id, '123', 'params id not on root level'))

  history.push('/123')
  history.push('/test/123')
})

test('matches pathnames with params on nested routes', t => {

  t.plan(1)

  let history = H.createMemoryHistory()
  let driver = makeRouteDriver(history)
  let router = driver(new Rx.Subject())

  router.route('/test').route('/:id').params$
    .forEach(params =>
      t.equal(params.id, '123', 'params id'))

  history.push('/test/123')
})

test('root location$ stream', t => {

  t.plan(2)

  let history = H.createMemoryHistory()
  let driver = makeRouteDriver(history)
  let router = driver(new Rx.Subject())
  let first$ = router.location$.take(1)
  let second$ = router.location$.slice(1)

  first$
    .forEach(location =>
      t.equal(location.pathname, '/', 'root route'))

  second$
    .forEach(location =>
      t.equal(location.pathname, '/second', 'another route'))

  history.push('/second')
})

test('routing to path')
test('redirect')
test('goBack')
