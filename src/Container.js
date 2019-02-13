import React from "react";
import { Switch, Route } from "react-router-dom";
import UI1 from "./UI1";
import UI2 from "./UI2";
import UI3 from "./UI3";

import Home from "./Home";
import About from "./About";
import Faq from "./Faq";

function Container({ location }) {
  return (
    <Switch location={location}>
      <Route exact path="/" component={Home} />
      <Route exact path="/UI1" component={UI1} />
      <Route exact path="/UI2" component={UI2} />
      <Route exact path="/UI3" component={UI3} />
      <Route exact path="/About" component={About} />
      <Route exact path="/Faq" component={Faq} />
    </Switch>
  );
}

export default Container;
