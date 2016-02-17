'use strict'

let test = require('tape')
let H = require('history')
let Rx = require('rx')
let cycleLocation = require('./')

let makeRouterDriver = cycleLocation.makeRouterDriver

test('matches pathnames with no params', t => {

  t.plan(2)

  let history = H.createMemoryHistory()
  let driver = makeRouterDriver(history)
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
  let driver = makeRouterDriver(history)
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
  let driver = makeRouterDriver(history)
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
  let driver = makeRouterDriver(history)
  let router = driver(new Rx.Subject())

  router.route('/test').route('/:id').params$
    .forEach(params =>
      t.equal(params.id, '123', 'params id'))

  history.push('/test/123')
})

test('root location$ stream', t => {

  t.plan(2)

  let history = H.createMemoryHistory()
  let driver = makeRouterDriver(history)
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

test('routing to various paths', t => {

  t.plan(5)

  let history = H.useQueries(H.createMemoryHistory)()
  let driver = makeRouterDriver(history)
  let sink$ = new Rx.Subject()
  let router = driver(sink$)

  router.route('/test').location$
    .forEach(location =>
      t.equal(location.pathname, '/test', 'routed'))

  router.route('/redirected').location$
    .forEach(location =>
      t.equal(location.pathname, '/redirected', 'redirected to path'))

  router.route('/forward').location$
    .forEach(location =>
      t.equal(location.pathname, '/forward', 'forward'))

  sink$.onNext('/test')
  sink$.onNext(router.redirect('/redirected'))
  sink$.onNext('/forward')
  sink$.onNext(router.goBack())
  sink$.onNext(router.goForward())
})

test('basename$', t => {

  t.plan(3)

  let history = H.createMemoryHistory()
  let driver = makeRouterDriver(history)
  let router = driver(new Rx.Subject())

  router.basename$
    .forEach(basename =>
      t.equal(basename, '/', 'root'))

  router.route('/test').basename$
    .forEach(basename =>
      t.equal(basename, '/test', 'one level deep'))

  router.route('/test/:id').basename$
    .forEach(basename =>
      t.equal(basename, '/test/123', 'with params'))

  history.push('/')
  history.push('/test')
  history.push('/test/123')
})

test('makeHref()', t => {

  t.plan(3)

  let history = H.createMemoryHistory()
  let driver = makeRouterDriver(history)
  let router = driver(new Rx.Subject())

  let href$ = router.makeHref('/hey')
  let nestedHref$ = router.route('/test').makeHref('/123')
  let paramsHref$ = router.route('/test/:id').makeHref('/456')

  href$
    .forEach(href =>
      t.equal(href, '/hey', 'root route'))

  nestedHref$
    .forEach(nestedHref =>
      t.equal(nestedHref, '/test/123', 'nested route'))

  paramsHref$
    .forEach(paramsHref =>
      t.equal(paramsHref, '/test/123/456', 'route with params'))

  history.push('/test')
  history.push('/test/123')
})
