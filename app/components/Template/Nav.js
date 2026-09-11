'use client';

import { usePathname } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';


import data from '../../data/contact';

const Nav = () => {
  const pathname = usePathname();
  return (
    <section id="sidebar">
        <section id="intro">
            <Link href="/" className="logo">
                <Image src="/images/me_icon.jpg" alt="Bowen K Liu" width={2452} height={3065} />
            </Link>
            <header>
                <h2>Bowen K&apos; Liu</h2>
                <p><a href="mailto:bowenkliu@gmail.com">bowenkliu@gmail.com</a></p>
            </header>
        </section>

        <section className="blurb">
            <h2>About the site </h2>
            <p> Hi this is a personal site feel free to take a look!{' '}
                <Link href="/about"> pictures :) </Link>
                <Link href="/resume">resume</Link>, {' '}
                <Link href="/projects">projects</Link>, {' '}
                or <Link href="/contact">contact</Link> me.
            </p>
            <ul className="actions">
                <li>
                    {!pathname.startsWith('/resume') ?
                        <Link href="/resume" className="button">Learn More</Link> :
                        <Link href="/about" className="button">About Me</Link>}
                </li>
            </ul>
        </section>

        <section id="footer">
            <ul className="icons">
                {data.map(s => (
                    <li key={s.label}><a href={s.link} aria-label={s.label}><FontAwesomeIcon icon={s.icon}/></a></li>
                ))}
            </ul>
            <p className="copyright">&copy; Bowen K&apos;Liu <Link href="/">bowenkliu.com</Link>.</p>
        </section>
    </section>
  );
};

export default Nav;
