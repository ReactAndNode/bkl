import React from "react";
import { BrowserRouter as Router } from "react-router-dom";
import Container from "./Container";
import Header from "./Header";
import Header2 from "./Header2";

// CSS
import "./CSS/Overall_styles.css";

// Separates app into different components for proper page formatting
class App extends React.Component {
  render() {
    return (
      <Router>
        <div className="overAll">
          <div className="MainBody">
            <Header />
            <Container />
          </div>
        </div>
      </Router>
    );
  }
}

export default App;
