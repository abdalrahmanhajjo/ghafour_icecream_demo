import { useApp } from '../state.jsx';
import Nav from '../components/Nav.jsx';
import Hero from '../components/Hero.jsx';
import { About, Features, Gallery, Location, Contact, Footer } from '../components/Marketing.jsx';
import Menu from '../components/Menu.jsx';
import Featured from '../components/Featured.jsx';
import Events from '../components/Events.jsx';
import CartDrawer from '../components/CartDrawer.jsx';
import ItemModal from '../components/ItemModal.jsx';

export default function Home() {
  const { t, lang, loaded } = useApp();
  return (
    <>
      <a className="skip-link" href="#menu">
        {lang === 'ar' ? 'تخطَّ إلى المنيو' : 'Skip to menu'}
      </a>
      <div className="announcement">{t('announcement')}</div>
      <Nav />
      <main id="home">
        <Hero />
        <About />
        <Features />
        <Menu />
        <Featured />
        <Events />
        <Gallery />
        <Location />
        <Contact />
      </main>
      <Footer />
      <CartDrawer />
      <ItemModal />
      {!loaded && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            display: 'grid',
            placeItems: 'center',
            background: 'rgba(255,253,247,.6)',
            zIndex: 300,
            fontWeight: 800,
            color: 'var(--mint-dark)',
          }}
        >
          …
        </div>
      )}
    </>
  );
}
