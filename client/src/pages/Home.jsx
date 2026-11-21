import { useEffect } from 'react';
import { useApp } from '../state.jsx';
import Nav from '../components/Nav.jsx';
import Hero from '../components/Hero.jsx';
import { Announcement, Facts, Story, Visit, Footer } from '../components/Marketing.jsx';
import Menu from '../components/Menu.jsx';
import Events from '../components/Events.jsx';
import CartDrawer from '../components/CartDrawer.jsx';
import ItemModal from '../components/ItemModal.jsx';
import OrderBar from '../components/OrderBar.jsx';

export default function Home() {
  const { lang, cartCount } = useApp();

  // leave room for the phone order bar so it never covers the footer
  useEffect(() => {
    document.body.classList.toggle('gh-has-bar', cartCount > 0);
    return () => document.body.classList.remove('gh-has-bar');
  }, [cartCount]);

  return (
    <div className="gh">
      <a className="gh-skip" href="#menu">
        {lang === 'ar' ? 'تخطَّ إلى المنيو' : 'Skip to menu'}
      </a>
      <Announcement />
      <Nav />
      <main id="home">
        <Hero />
        <Facts />
        <Menu />
        <Events />
        <Story />
        <Visit />
      </main>
      <Footer />
      <OrderBar />
      <CartDrawer />
      <ItemModal />
    </div>
  );
}
