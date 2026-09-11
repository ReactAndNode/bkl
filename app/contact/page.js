import Main from '../layouts/Main';
import ContactContent from '../components/Contact/ContactContent';

export const metadata = { title: 'Contact', alternates: { canonical: '/contact/' } };

export default function ContactPage() {
  return <Main><ContactContent /></Main>;
}
