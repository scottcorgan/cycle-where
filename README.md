# cycle-where

Cycle.js router driver with less configuration, more `map()`, and more fun

## Install

```
npm install cycle-where -S
```

## Usage

**The Driver**

```js
import Cycle from '@cycle/core'
import {makeRouterDriver} from 'cycle-where'
import {browserHistory} from 'history'

let main = () => {}
let drivers = {
  router: makeRouterDriver(browserHistory) // Pass raw history into driver
}

Cycle.run(main, drivers)
```

**Using Components**

```js
import {Observable} from 'rx'
import {div, a} from '@cycle/dom'

export default function Main ({router, DOM}) {

  // Intercept link clicks for route navigation
  let navigate$ = DOM.select('a').events('click')
    .map(preventDefault)
    .map(e => e.target.getAttribute('href'))

  let userRoute = router.route('/user')

  // Renders for '/users'
  let allUsersDOM$ = usersRoute.location$
    .map(location =>
      div('Showing all users'))

  // Renders for '/users/123', etc. Nesting routes can help with namespaces.
  let singleUserDOM$ = userRoute.route('/users/:userId').params$
    .map(params =>
      div([
        `Showing user: ${params.userId}`,
        a({href: '/users'}, 'See all Users')]))

  return {
    router: navigate$,
    DOM: Observable.merge(allUsersDOM$, singleUserDOM$)
  }
}

function preventDefault (e) {

  e.preventDefault()
  return e
}
```

## API

(Coming. Look at tests for now.)

## Running Unit Tests

```
npm test
```
