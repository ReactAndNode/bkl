import React from 'react';

import Course from './Courses/Course';

const getRows = courses => [...courses].sort((a, b) => {
  let ret = 0;
  if (a.univerity > b.univerity) ret = -1;
  else if (a.univerity < b.univerity) ret = 1;
  else if (a.number > b.number) ret = 1;
  else if (a.number < b.number) ret = -1;
  return ret;
}).map((course, idx) => (
  <Course
    data={course}
    key={course.title}
    last={idx === courses.length - 1}
  />
));

const Courses = ({ data = [] }) => (
  <div className="courses">
    <div className="link-to" id="courses" />
    <div className="title">
      <h2>Selected Courses</h2>
    </div>
    <ul className="course-list">
      {getRows(data)}
    </ul>
  </div>
);



export default Courses;
