import React from 'react';
import {Link} from 'react-router-dom';
import Helmet from 'react-helmet';
import Gallery from "react-photo-gallery";

import Main from '../layouts/Main';


const photos = [
    {
        src: "https://source.unsplash.com/2ShvY8Lf6l0/800x599",
        width: 4,
        height: 3
    },
    {
        src: "https://source.unsplash.com/Dm-qxdynoEc/800x799",
        width: 1,
        height: 1
    },
    {
        src: "https://source.unsplash.com/qDkso9nvCg0/600x799",
        width: 3,
        height: 4
    },
    {
        src: "https://source.unsplash.com/iecJiKe_RNg/600x799",
        width: 3,
        height: 4
    },
    {
        src: "https://source.unsplash.com/epcsn8Ed8kY/600x799",
        width: 3,
        height: 4
    },
    {
        src: "https://source.unsplash.com/NQSWvyVRIJk/800x599",
        width: 4,
        height: 3
    },
    {
        src: "https://source.unsplash.com/zh7GEuORbUw/",
        width: 3,
        height: 4
    },
    {
        src: "https://source.unsplash.com/PpOHJezOalU/",
        width: 4,
        height: 3
    }
];

function columns(containerWidth) {
    let columns = 1;
    if (containerWidth >= 500) columns = 2;
    if (containerWidth >= 900) columns = 3;
    if (containerWidth >= 1500) columns = 4;
    return columns;
}


const About = () => (
    <Main>
        <Helmet title="About"/>
        <article className="post" id="about">
            <header>
                <div className="title">
                    <h2><Link to="/about"> picture </Link></h2>
                    <p> Not the best photographer but I do enjoy pictures :)</p>
                </div>
            </header>
            <Gallery photos={photos} columns={columns}/>
        </article>
    </Main>
);

export default About;
