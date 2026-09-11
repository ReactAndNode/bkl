import Link from 'next/link';
import Image from 'next/image';
import Main from '../layouts/Main';
import photos from '../data/photos';

export const metadata = { title: 'Picture', alternates: { canonical: '/about/' } };

export default function PicturePage() {
  return (
    <Main>
      <article className="post" id="about">
        <header>
          <div className="title">
            <h2><Link href="/about">picture</Link></h2>
            <p>Not the best photographer but I do enjoy pictures :)</p>
          </div>
        </header>
        <div className="photo-gallery">
          {photos.map((photo, index) => (
            <Image key={photo.src} src={photo.src} width={photo.width * 300}
              height={photo.height * 300} alt={`Gallery photo ${index + 1}`} />
          ))}
        </div>
      </article>
    </Main>
  );
}
