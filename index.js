'use strict'

let path = require('path')
let Route = require('route-parser')
let curry = require('ramda/src/curry')
// let memoize = require('ramda/src/memoize')
let Rx = require('rx')

let Observable = Rx.Observable
let ReplaySubject = Rx. ReplaySubject

const BACK = 'BACK'
const FORWARD = 'FORWARD'
const REDIRECT = 'REDIRECT'

let getParams = (r, pathname) => (new Route(r)).match(pathname)
let matchesRoute = curry((r, location) => !!getParams(r, location.pathname))
let isObservable = val => (typeof val === 'object' && typeof val.subscribe === 'function')

exports.makeRouterDriver = function makeRouterDriver (history) {

  return sink$ => {

    let rootSource$ = new ReplaySubject(1)
    history.listen(location => rootSource$.onNext(location))

    let customActions$ = sink$.filter(isObservable).mergeAll()
    let pushActions$ = sink$.filter(value => !isObservable(value))

    pushActions$.forEach(pathname => history.push(pathname))
    customActions$
      .forEach(action => {

        switch (action.type) {
          case BACK: {
            return history.goBack()
          }

          case FORWARD: {
            return history.goForward()
          }

          case REDIRECT: {
            return history.replace(action.payload)
          }

          default: {
            throw new TypeError('Invalid type for router action')
          }
        }
      })

    return {
      location$: rootSource$,
      route: (nextRoutePath) => makeRoute(rootSource$, '/', nextRoutePath),
      redirect: pathanme => Observable.just({type: REDIRECT, payload: pathanme}),
      goBack: () => Observable.just({type: BACK}),
      goForward: () => Observable.just({type: FORWARD})
    }
  }
}

function makeRoute (source$, baseRoutePath, routePath) {

  let fullRoutePath = path.join(baseRoutePath, routePath)
  let location$ = source$.filter(matchesRoute(fullRoutePath))
  let params$ = location$.map(location => getParams(fullRoutePath, location.pathname))

  function route (nextRoutePath) {

    return makeRoute(
      source$.filter(matchesRoute(`${baseRoutePath}*next`)),
      path.join(baseRoutePath, routePath),
      nextRoutePath
    )
  }

  return {
    location$,
    params$,
    route
  }
}
