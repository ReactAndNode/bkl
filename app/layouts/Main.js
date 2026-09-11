import Header from '../components/Template/Header';
import Nav from '../components/Template/Nav';

export default function Main({ children, fullPage = false }) {
  return (
    <div id="wrapper">
      <Header />
      <main id="main">{children}</main>
      {!fullPage && <Nav />}
    </div>
  );
}
