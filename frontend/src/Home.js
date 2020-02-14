import React from 'react'
import { Switch, Route, BrowserRouter as Router } from 'react-router-dom'
import { PageNotFound } from './PageNotFound'
import { LandingPage } from './LandingPage'
export const Home = () => (
  <Router>
    <Switch>
      <Route exact path="/">
        <LandingPage />
      </Route>

      <Route>
        <PageNotFound />
      </Route>
    </Switch>
  </Router>
)
