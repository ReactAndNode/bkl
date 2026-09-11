import React from 'react';

import Job from './Experience/Job';

const Experience = ({ data = [] }) => (
  <div className="experience">
    <div className="link-to" id="experience" />
    <div className="title">
      <h2>Experience</h2>
    </div>
    {data.map(job => (
      <Job
        data={job}
        key={job.company}
      />
    ))}
  </div>
);




export default Experience;
