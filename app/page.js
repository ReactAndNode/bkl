import { readFile } from 'node:fs/promises';
import path from 'node:path';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import Main from './layouts/Main';

export const metadata = {
  title: { absolute: 'About | Bowen K Liu' },
  alternates: { canonical: '/' },
};

export default async function HomePage() {
  const markdown = await readFile(path.join(process.cwd(), 'app/data/about.md'), 'utf8');
  const count = markdown.split(/\s+/).map(s => s.replace(/\W/g, '')).filter(Boolean).length;

  return (
    <Main>
      <article className="post" id="about">
        <header>
          <div className="title">
            <h2><Link href="/">About Me</Link></h2>
            <p>(in about {count} words)</p>
          </div>
        </header>
        <ReactMarkdown rehypePlugins={[rehypeRaw]}>{markdown}</ReactMarkdown>
      </article>
    </Main>
  );
}
