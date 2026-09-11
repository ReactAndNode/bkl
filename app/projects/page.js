export const metadata = { title: 'Projects', alternates: { canonical: '/projects/' } };

import React from 'react';
import Link from 'next/link';

import Main from '../layouts/Main';

import Cell from '../components/Projects/Cell';
import data from '../data/projects';

const Projects = () => (
  <Main>
    <article className="post" id="projects">
      <header>
        <div className="title">
          <h2><Link href="/projects">Projects</Link></h2>
          <p>Here are some of my Personal Projects</p>
        </div>
      </header>
      {data.map(project => (
        <Cell
          data={project}
          key={project.title}
        />
      ))}
    </article>
  </Main>
);

export default Projects;
