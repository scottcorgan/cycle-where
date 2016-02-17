'use strict'

let Rx = require('rx')
let urlJoin = require('url-join')
let routeParams = require('route-params')

let Observable = Rx.Observable
let ReplaySubject = Rx. ReplaySubject

const BACK = 'BACK'
const FORWARD = 'FORWARD'
const REDIRECT = 'REDIRECT'

let isObservable = val => (typeof val === 'object' && typeof val.subscribe === 'function')

exports.makeRouterDriver = function makeRouterDriver (history) {

  return sink$ => {

    let source$ = new ReplaySubject(1)
    history.listen(location => source$.onNext(location))

    let customActions$ = sink$.filter(isObservable).mergeAll()
    let pushActions$ = sink$.filter(value => !isObservable(value))
    let basename$ = Rx.Observable.just('/')

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

    // TODO: get rid of duplication with makeRoute() here
    return {
      location$: source$,
      basename$,
      route: nextRoutePath => makeRoute(source$, '/', nextRoutePath),
      redirect: pathanme => Observable.of({type: REDIRECT, payload: pathanme}), // TODO: need to put these on nested routes too
      goBack: () => Observable.of({type: BACK}),
      goForward: () => Observable.of({type: FORWARD}),
      makeHref: p => Observable.of(p)
    }
  }
}

function makeRoute (source$, baseRoutePath, routePath) {

  let fullRoutePath = urlJoin(baseRoutePath, routePath)
  let location$ = source$.filter(location => routeParams(fullRoutePath, location.pathname))
  let params$ = location$.map(location => routeParams(fullRoutePath, location.pathname))
  let basename$ = location$.map(location => location.pathname)

  function route (nextRoutePath) {

    return makeRoute(
      source$.filter(location => routeParams(`${baseRoutePath}*:next`, location.pathname)),
      urlJoin(baseRoutePath, routePath),
      nextRoutePath
    )
  }

  function makeHref (pathname) {

    return basename$
      .map(basename =>
        urlJoin(basename, pathname))
  }

  return {
    location$,
    basename$,
    params$,
    route,
    makeHref
  }
}
