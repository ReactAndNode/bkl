import React from 'react';


const Cell = ({data}) => (
    <div className="cell-container">
        <article className="mini-post">
            <header>
                <h3><a href={data.link}>{data.title}</a></h3>
            </header>
            <p>

            </p>

            <div className="description">
                <p>{data.desc}</p>
            </div>
        </article>
    </div>
);


export default Cell;
