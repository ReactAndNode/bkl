export const metadata = { title: '404' };

import React from 'react';
import Link from 'next/link';

const PageNotFound = () => (
  <div className="not-found">
    <h1>Page Not Found.</h1>
    <p>Return to <Link href="/">index</Link>.</p>
  </div>
);

export default PageNotFound;
