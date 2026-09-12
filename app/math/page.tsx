import Header from '../components/Template/Header';
import Sumday from './_components/sumday';
import './sumday.css';

export const metadata = {
  title: { absolute: 'Sumday — A little math, every day' },
  description: 'Practice mental math, learn everyday statistics, and calculate tips with confidence. A free daily brain workout.',
  alternates: { canonical: '/math/' },
  openGraph: { title: 'Sumday — A little math, every day', description: 'One-minute math and tipping games, plus a practical statistics study path.', url: '/math/', type: 'website' },
};

export default function MathPage() {
  return <><Header /><Sumday /></>;
}
