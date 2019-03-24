import React from 'react';
import {Link} from 'react-router-dom';
import Helmet from 'react-helmet';

import Main from '../layouts/Main';

const About = () => (
    <Main>
        <Helmet title="About"/>
        <article className="post" id="about">
            <header>
                <div className="title">
                    <h2><Link to="/about"> pic a boo</Link></h2>
                    <p> Not the best photographer but I do enjoy pictures :)</p>
                </div>
            </header>
            <p> Insert pictures here</p>
        </article>
    </Main>
);

export default About;
