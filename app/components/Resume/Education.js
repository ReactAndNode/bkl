import React from 'react';

import Degree from './Education/Degree';

const Education = ({ data = [] }) => (
  <div className="education">
    <div className="link-to" id="education" />
    <div className="title">
      <h2>Education</h2>
    </div>
    {data.map(degree => (
      <Degree
        data={degree}
        key={degree.school}
      />
    ))}
  </div>
);




export default Education;
