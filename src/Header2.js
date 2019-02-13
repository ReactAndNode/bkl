import React from "react";
import { Link } from "react-router-dom";
import "./CSS/Overall_styles.css";

class Header2 extends React.Component {
  constructor() {
    super();
    this.state = {};
  }

  render() {
    return (
      <div className="LogoHeader">
        <Link to="/">
          <img alt="" src="xxx.png" className="logo" />
        </Link>
      </div>
    );
  }
}

export default Header2;
