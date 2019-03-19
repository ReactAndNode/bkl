import React from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';


import data from '../../data/contact';

const Nav = () => (
  <section id="sidebar">
    <section id="intro">
      <Link to="/" className="logo">
        <img src={`${BASE_PATH}/images/me_icon.jpg`} alt="" />
      </Link>
      <header>
        <h2>Bowen K&apos; Liu</h2>
        <p><a href="mailto:bowenkliu@gmail.com">bowenkliu@gmail.com</a></p>
      </header>
    </section>

    <section className="blurb">
      <h2>Who am I?</h2>
      <p>Hi, I&apos;m Bowen. I graduated from the University of Maryland, College Park 2018. I am currently a software engineer at Google</p>
      <ul className="actions">
        <li>
          {window.location.pathname !== `${BASE_PATH}/resume` ? <Link to="/resume" className="button">Learn More</Link> : <Link to="/about" className="button">About Me</Link>}
        </li>
      </ul>
    </section>

    <section id="footer">
      <ul className="icons">
        {data.map(s => (
          <li key={s.label}><a href={s.link}><FontAwesomeIcon icon={s.icon} /></a></li>
        ))}
      </ul>
      <p className="copyright">&copy; Bowen K&apos;Liu <Link to="/">bowenkliu.com</Link>.</p>
    </section>
  </section>
);

export default Nav;
