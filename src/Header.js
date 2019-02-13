import React from "react";
import { Link } from "react-router-dom";

import "./CSS/Header_styles.css";

// Dashboard links
function Header() {
  return (
    <div className="mySidebar">
      <ul className="Nav__item-wrapper">
        <li className="dashboard">
          <Link to="/"> Home </Link>
        </li>
        <li className="dashboard">
          <Link to="/UI1"> component 1 </Link>
        </li>
        <li className="dashboard">
          <Link to="/UI2"> component 2 </Link>
        </li>
        <li className="dashboard">
          <Link to="/UI3"> component 3 </Link>
        </li>
      </ul>
      <div className="footerBar">
        <li className="dashboard">
          <Link to="/About">About </Link>
        </li>
        <li className="dashboard">
          <Link to="/Faq"> FAQ </Link>
        </li>
      </div>
    </div>
  );
}

export default Header;
