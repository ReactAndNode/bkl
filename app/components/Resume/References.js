import React from 'react';
import { Link } from 'react-router-dom';

const References = () => (
  <div className="references">
    <div className="link-to" id="references" />
    <div className="title">
      <Link to="/contact">
        <h2>References are available upon request</h2>
      </Link>
    </div>
  </div>
);

export default References;
