'use client';

import { useRef } from 'react';
import Link from 'next/link';
import routes from '../../data/routes';

export default function Hamburger() {
  const dialog = useRef(null);
  const close = () => dialog.current.close();

  return (
    <div className="hamburger-container">
      <button className="menu-toggle" type="button" aria-label="Open navigation"
        aria-haspopup="dialog" aria-controls="mobile-navigation"
        onClick={() => dialog.current.showModal()}>
        <span aria-hidden="true">&#9776;</span>
      </button>
      <dialog ref={dialog} id="mobile-navigation" className="mobile-menu" aria-label="Navigation"
        onClick={event => { if (event.target === event.currentTarget) close(); }}>
        <button type="button" className="menu-close" onClick={close} autoFocus>Close menu</button>
        <nav aria-label="Mobile navigation">
          <ul className="hamburger-ul">
            {routes.map(route => (
              <li key={route.path}>
                <Link href={route.path} onClick={close}>
                  <h3 className={route.index ? 'index-li' : undefined}>{route.label}</h3>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </dialog>
    </div>
  );
}
