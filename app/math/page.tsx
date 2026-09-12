import Header from '../components/Template/Header';
import Sumday from './_components/sumday';
import './sumday.css';

export const metadata = {
  title: { absolute: 'Sumday — A little math, every day' },
  description: 'Practice mental math, everyday statistics, tipping, poker odds, and stock-market reasoning. A free daily brain workout.',
  alternates: { canonical: '/math/' },
  openGraph: { title: 'Sumday — A little math, every day', description: 'One-minute math and tipping games, a statistics study path, and interactive poker and stock labs.', url: '/math/', type: 'website' },
};

export default function MathPage() {
  return <><Header /><Sumday /></>;
}
