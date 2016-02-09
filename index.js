import path from 'path'
import Route from 'route-parser'
import curry from 'ramda/src/curry'
import memoize from 'ramda/src/memoize'
import {Observable, ReplaySubject} from 'rx'

const BACK = 'BACK'
const REDIRECT = 'REDIRECT'

let getParams = memoize((r, pathname) => (new Route(r)).match(pathname))
let matchesRoute = memoize(curry((r, location) => !!getParams(r, location.pathname)))
let isObservable = val => (typeof val === 'object' && typeof val.subscribe === 'function')

export default function makeRouterDriver (history) {

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

          case REDIRECT: {
            return history.replace(...action.payload)
          }

          default: {
            throw new TypeError('Invalid type for router action')
          }
        }
      })

    return {
      ...makeRoute(rootSource$, '/'),
      redirect: (...values) => Observable.just({
        type: REDIRECT,
        payload: values
      }),
      goBack: () => Observable.just({
        type: BACK
      })
    }
  }
}

function makeRoute (source$, baseRoutePath, routePath = '/') {

  let fullRoutePath = path.join(baseRoutePath, routePath)
  let filteredSource$ = source$.filter(matchesRoute(fullRoutePath))

  let location$ = filteredSource$
    .map(location => {

      return {
        ...location,
        params: getParams(fullRoutePath, location.pathname)
      }
    })

  function route (nextRoutePath) {

    return makeRoute(
      source$.filter(matchesRoute(`${baseRoutePath}*next`)),
      path.join(baseRoutePath, routePath),
      nextRoutePath
    )
  }

  return {
    location$,
    route
  }
}
