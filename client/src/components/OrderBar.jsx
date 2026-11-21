import { useApp } from '../state.jsx';
import Icon from './Icon.jsx';

/** Phone-only bar that keeps the next step (review & send the order) within thumb reach. */
export default function OrderBar() {
  const { t, lang, cartCount, cartTotal, openCart, cartOpen, modalSlug, menuOpen } = useApp();
  const hidden = cartCount === 0 || cartOpen || modalSlug || menuOpen;
  if (hidden) return null;
  const count = lang === 'ar' ? String(cartCount).replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[d]) : cartCount;
  return (
    <div className="gh-orderbar">
      <button type="button" className="gh-orderbar-btn" onClick={openCart}>
        <span className="gh-orderbar-count" aria-hidden="true">
          {count}
        </span>
        <span>{t('viewOrder')}</span>
        <b dir="ltr">${cartTotal.toFixed(2)}</b>
        <Icon name="bag" size={20} />
      </button>
    </div>
  );
}
