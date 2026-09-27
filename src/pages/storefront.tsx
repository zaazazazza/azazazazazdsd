import { useQuery } from '@tanstack/react-query';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUpRight, Check, Menu, Search, ShieldCheck, Sparkles, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link, useRoute } from 'wouter';

type StoreProduct = {
  id: string;
  name: string;
  price: number | null;
  currency: string;
  stock: number | null;
  imageUrls: string[];
  isBestSeller: boolean;
  order: number | null;
};

async function getProducts(): Promise<StoreProduct[]> {
  const response = await fetch('/api/komerza/products');
  if (!response.ok) throw new Error(response.status === 503 ? 'Catalogue Komerza non configuré.' : 'Le catalogue est momentanément indisponible.');
  return response.json() as Promise<StoreProduct[]>;
}

function useProducts() {
  return useQuery({ queryKey: ['storefront-products'], queryFn: getProducts, staleTime: 60_000 });
}

function productCategory(name: string) {
  const normalized = name.toLocaleLowerCase();
  if (/epicgames|valorant|logs/.test(normalized)) return 'Logs EpicGames & Valorant';
  if (/spotify|netflix|crunchyroll/.test(normalized)) return 'Streaming';
  if (/^g3n\b/.test(normalized)) return 'G3N';
  if (/vpn/.test(normalized)) return 'VPN';
  if (/nfa|skins?|v ?bucks|twitch prime|leviathan|omega|bonnet bleue/.test(normalized)) return 'Fortnite / NFA';
  if (/cloud|checker|combo|multichecker/.test(normalized)) return 'Cloud / Checkers';
  return 'Autres produits';
}

function StoreHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  return <header className="store-header">
    <Link href="/" className="store-brand" aria-label="Sicario Store accueil"><span className="brand-mark">S</span><span>SICARIO <b>STORE</b></span></Link>
    <nav className={menuOpen ? 'store-nav is-open' : 'store-nav'} aria-label="Navigation principale">
      <Link href="/komerza" onClick={() => setMenuOpen(false)}>Catalogue</Link>
      <a href="/#manifesto" onClick={() => setMenuOpen(false)}>Notre approche</a>
      <a href="https://discord.com" target="_blank" rel="noreferrer" onClick={() => setMenuOpen(false)}>Support <ArrowUpRight size={13} /></a>
    </nav>
    <Link href="/komerza" className="store-header-cta">Explorer <ArrowRight size={15} /></Link>
    <button className="store-menu-toggle" aria-label={menuOpen ? 'Fermer le menu' : 'Ouvrir le menu'} onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X /> : <Menu />}</button>
  </header>;
}

function StoreFooter() {
  return <footer className="store-footer"><Link href="/" className="store-brand"><span className="brand-mark">S</span><span>SICARIO <b>STORE</b></span></Link><span>© 2026 Sicario Store</span><span>Catalogue synchronisé avec Komerza</span></footer>;
}

function StoreFrame({ children }: { children: React.ReactNode }) {
  return <div className="storefront"><StoreHeader />{children}<StoreFooter /></div>;
}

function ProductCard({ product, index = 0 }: { product: StoreProduct; index?: number }) {
  const reducedMotion = useReducedMotion();
  const [imageFailed, setImageFailed] = useState(false);
  const availability = product.stock === null ? 'pending' : product.stock > 0 ? 'available' : 'unavailable';
  return <motion.article className="product-card" initial={reducedMotion ? false : { opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-30px' }} transition={{ duration: 0.42, delay: Math.min(index * 0.06, 0.24) }}>
    <Link href={`/komerza/${encodeURIComponent(product.id)}`} className="product-card-link">
      <div className="product-image-wrap">
        {product.imageUrls[0] && !imageFailed ? <img src={product.imageUrls[0]} alt={product.name} loading="lazy" onError={() => setImageFailed(true)} /> : <div className="product-image-empty"><span>S</span><small>SICARIO / ITEM {String(index + 1).padStart(2, '0')}</small></div>}
        <span className={`product-status ${availability}`}><i />{availability === 'pending' ? 'À CONFIRMER' : availability === 'available' ? 'DISPONIBLE' : 'ÉPUISÉ'}</span>
        <span className="product-card-arrow"><ArrowUpRight size={16} /></span>
      </div>
      <div className="product-meta"><span className="product-id">KOMERZA / {product.id.slice(0, 8)}</span>{product.isBestSeller && <span className="bestseller">SÉLECTION</span>}</div>
      <div className="product-title-row"><h3>{product.name}</h3><span className="product-price">{product.price === null ? 'Sur demande' : `${product.price.toFixed(2)} €`}</span></div>
      <span className="product-link-label">VOIR LE PRODUIT <ArrowRight size={13} /></span>
    </Link>
  </motion.article>;
}

function ProductGrid({ products, loading, error }: { products: StoreProduct[]; loading: boolean; error: Error | null }) {
  if (loading) return <div className="product-grid" aria-label="Chargement du catalogue">{Array.from({ length: 6 }, (_, index) => <div className="product-skeleton" key={index}><div /><span /><i /></div>)}</div>;
  if (error) return <div className="catalog-message"><span className="catalog-error-dot" /><h3>Catalogue indisponible</h3><p>{error.message}</p><button onClick={() => window.location.reload()}>Réessayer</button></div>;
  if (!products.length) return <div className="catalog-message"><span className="catalog-error-dot" /><h3>Aucun produit trouvé</h3><p>Essayez une autre recherche ou revenez un peu plus tard.</p></div>;
  return <div className="product-grid">{products.map((product, index) => <ProductCard key={product.id} product={product} index={index} />)}</div>;
}

export function HomePage() {
  const { data = [], isLoading, error } = useProducts();
  const reducedMotion = useReducedMotion();
  const [featuredImageFailed, setFeaturedImageFailed] = useState(false);
  const featured = data.find((product) => product.isBestSeller && product.imageUrls.length) ?? data.find((product) => product.imageUrls.length);
  return <StoreFrame>
    <main>
      <section className="store-hero">
        <div className="hero-grain" />
        <div className="hero-copy">
          <motion.div className="eyebrow" initial={reducedMotion ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}><span className="eyebrow-line" /> CURATION DIGITALE · EST. MMXXIV</motion.div>
          <motion.h1 initial={reducedMotion ? false : { opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.1 }}>L’ACCÈS<br /><span>AU PROCHAIN</span><br /><em>NIVEAU.</em></motion.h1>
          <motion.p initial={reducedMotion ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.28 }}>Des essentiels numériques sélectionnés avec exigence. Disponibles sans détour.</motion.p>
          <motion.div className="hero-actions" initial={reducedMotion ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.38 }}><Link href="/komerza" className="button-lime">Découvrir le store <ArrowUpRight size={16} /></Link><a href="#manifesto" className="button-quiet">Notre différence <ArrowDown size={14} /></a></motion.div>
        </div>
        <div className="hero-art" aria-hidden="true">
          <div className="hero-orbit orbit-one" /><div className="hero-orbit orbit-two" /><div className="hero-plate"><span className="plate-top">SICARIO / DIGITAL GOODS</span><b>S</b><span className="plate-bottom">SELECTED ACCESS <i>•</i> 001</span></div>
          {featured && <motion.div className="hero-feature" initial={reducedMotion ? false : { opacity: 0, x: 25, rotate: 4 }} animate={{ opacity: 1, x: 0, rotate: 0 }} transition={{ duration: 0.7, delay: 0.55 }}><div className="hero-feature-image">{featured.imageUrls[0] && !featuredImageFailed ? <img src={featured.imageUrls[0]} alt="" onError={() => setFeaturedImageFailed(true)} /> : <span className="hero-image-fallback">S</span>}</div><div><small>EN VEDETTE / KOMERZA</small><strong>{featured.name}</strong><span>{featured.price === null ? 'Prix sur demande' : `${featured.price.toFixed(2)} €`}</span></div></motion.div>}
          <span className="hero-coordinate">48°51'24.0&quot;N<br />02°21'08.0&quot;E</span>
        </div>
        <div className="hero-bottom"><span>01 / SÉLECTION DU MOMENT</span><a href="#manifesto">DÉFILER POUR EXPLORER <ArrowDown size={12} /></a><span>PARIS · EN LIGNE</span></div>
      </section>

      <section id="manifesto" className="manifesto-section"><div className="section-index">01 — NOTRE APPROCHE</div><div className="manifesto-content"><h2>Le digital, <span>sans le bruit.</span></h2><p>Une sélection claire. Des informations transparentes. Un catalogue relié directement à sa source pour que ce que vous voyez soit ce qui est disponible.</p><div className="promise-list"><div><ShieldCheck /><span><b>Source vérifiée</b><small>Catalogue synchronisé avec Komerza</small></span><Check /></div><div><Sparkles /><span><b>Sélection sans détour</b><small>Chaque produit, ses informations réelles</small></span><Check /></div><div><ArrowRight /><span><b>Support humain</b><small>Une équipe accessible via Discord</small></span><Check /></div></div></div></section>

      <section className="featured-section"><div className="section-heading"><div><div className="section-index">02 — LA SÉLECTION</div><h2>En ce moment<span>.</span></h2></div><Link href="/komerza" className="text-link">Voir tout le catalogue <ArrowUpRight size={15} /></Link></div><ProductGrid products={data.slice(0, 4)} loading={isLoading} error={error as Error | null} /></section>

      <section className="process-section"><div className="section-index">03 — SIMPLE COMME ÇA</div><h2>Trois étapes.<br /><span>Aucune friction.</span></h2><div className="process-steps"><article><span>01</span><h3>Explorez</h3><p>Parcourez les produits synchronisés en temps réel depuis notre catalogue.</p></article><article><span>02</span><h3>Choisissez</h3><p>Consultez les informations et la disponibilité avant de vous décider.</p></article><article><span>03</span><h3>Échangez</h3><p>Notre équipe vous accompagne pour finaliser votre demande sur Discord.</p></article></div></section>

      <section className="closing-cta"><span className="section-index">04 — À VOUS DE JOUER</span><h2>Votre prochain<br /><i>mouvement.</i></h2><Link href="/komerza" className="button-lime">Explorer la sélection <ArrowUpRight size={16} /></Link><span className="cta-serial">SICARIO STORE / FIN DE TRANSMISSION</span></section>
      {error && <p className="home-catalog-note">Le catalogue n’a pas pu être chargé. Vous pouvez réessayer depuis la page catalogue.</p>}
    </main>
  </StoreFrame>;
}

export function CatalogPage() {
  const { data = [], isLoading, error } = useProducts();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [availability, setAvailability] = useState('all');
  const [sort, setSort] = useState('featured');
  const categories = useMemo(() => Array.from(new Set(data.map((product) => productCategory(product.name))).values()).sort((a, b) => a.localeCompare(b)), [data]);
  const products = useMemo(
    () => data
      .filter((product) => product.name.toLocaleLowerCase().includes(search.toLocaleLowerCase()))
      .filter((product) => category === 'all' || productCategory(product.name) === category)
      .filter((product) => availability === 'all' || (availability === 'available' ? product.stock !== null && product.stock > 0 : product.stock !== null && product.stock <= 0))
      .sort((a, b) => sort === 'name' ? a.name.localeCompare(b.name) : sort === 'price' ? (a.price ?? Number.MAX_VALUE) - (b.price ?? Number.MAX_VALUE) : Number(b.isBestSeller) - Number(a.isBestSeller) || (a.order ?? Number.MAX_VALUE) - (b.order ?? Number.MAX_VALUE)),
    [data, search, category, availability, sort],
  );
  return <StoreFrame><main className="catalog-page"><div className="catalog-hero"><div className="section-index">SICARIO STORE / CATALOGUE KOMERZA</div><h1>Pièces choisies<span>.</span></h1><p>Des essentiels numériques, sélectionnés et disponibles sans détour.</p></div><div className="catalog-controls"><label className="catalog-search"><Search size={16} /><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Rechercher un produit" aria-label="Rechercher un produit" /></label><label><span className="sr-only">Catégorie</span><select value={category} onChange={(event) => setCategory(event.target.value)}><option value="all">Catégorie · Tout</option>{categories.map((item) => <option key={item} value={item}>{item}</option>)}</select></label><label><span className="sr-only">Disponibilité</span><select value={availability} onChange={(event) => setAvailability(event.target.value)}><option value="all">Disponibilité · Tout</option><option value="available">Disponible</option><option value="unavailable">Épuisé</option></select></label><label><span className="sr-only">Trier par</span><select value={sort} onChange={(event) => setSort(event.target.value)}><option value="featured">Trier · Sélection</option><option value="name">Nom</option><option value="price">Prix croissant</option></select></label><span className="catalog-count">{isLoading ? '…' : `${products.length} PRODUIT${products.length === 1 ? '' : 'S'}`}</span></div><ProductGrid products={products} loading={isLoading} error={error as Error | null} /></main></StoreFrame>;
}

export function ProductPage() {
  const [, params] = useRoute('/komerza/:product');
  const id = params?.product ? decodeURIComponent(params.product) : '';
  const products = useProducts();
  const product = products.data?.find((item) => item.id === id);
  const [imageIndex, setImageIndex] = useState(0);
  const [imageFailed, setImageFailed] = useState(false);
  const images = product?.imageUrls ?? [];
  return <StoreFrame>
    <main className="product-detail-page">
      <Link href="/komerza" className="back-link"><ArrowLeft size={15} /> Retour au catalogue</Link>
      {products.isLoading ? <div className="detail-skeleton" /> : products.error ? <div className="catalog-message"><h3>Produit indisponible</h3><p>{products.error.message}</p></div> : !product ? <div className="catalog-message"><h3>Produit introuvable</h3><p>Ce produit n’est plus présent dans le catalogue.</p></div> : <div className="product-detail">
        <div className="product-gallery">
          <div className="detail-main-image">
            {images[imageIndex] && !imageFailed ? <AnimatePresence mode="wait"><motion.img key={images[imageIndex]} src={images[imageIndex]} alt={product.name} onError={() => setImageFailed(true)} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} /></AnimatePresence> : <div className="product-image-empty"><span>S</span></div>}
          </div>
          {images.length > 1 && <div className="thumbnail-row">{images.map((image, index) => <button key={image} className={index === imageIndex ? 'thumbnail is-active' : 'thumbnail'} onClick={() => { setImageIndex(index); setImageFailed(false); }} aria-label={`Afficher l’image ${index + 1}`}><img src={image} alt="" onError={(event) => { event.currentTarget.style.visibility = 'hidden'; }} /></button>)}</div>}
        </div>
        <aside className="product-detail-info">
          <div className="section-index">KOMERZA / {product.id}</div>
          <h1>{product.name}</h1>
          <p className="detail-price">{product.price === null ? 'Prix sur demande' : `${product.price.toFixed(2)} €`}</p>
          <span className={product.stock === null ? 'detail-availability pending' : product.stock > 0 ? 'detail-availability' : 'detail-availability unavailable'}><i />{product.stock === null ? 'Disponibilité à confirmer' : product.stock > 0 ? `${product.stock} disponible${product.stock === 1 ? '' : 's'}` : 'Actuellement épuisé'}</span>
          <p className="detail-description">Les informations affichées sont synchronisées depuis Komerza. Pour toute question ou demande, contactez notre équipe.</p>
          <a className="button-lime detail-contact" href="https://discord.com" target="_blank" rel="noreferrer">Contacter le support <ArrowUpRight size={16} /></a>
          <div className="detail-reassurance"><div><ShieldCheck size={17} /><span>Source catalogue vérifiée</span></div><div><Check size={17} /><span>Disponibilité synchronisée</span></div></div>
        </aside>
      </div>}
    </main>
  </StoreFrame>;
}