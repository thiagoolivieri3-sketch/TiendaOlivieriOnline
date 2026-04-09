/* Simple interactive behaviors: smooth scroll, product whatsapp messages, subtle reveal on scroll, product modal */
document.addEventListener('DOMContentLoaded', () => {
  const btnStore = document.getElementById('btn-store');
  const catalog = document.getElementById('catalog');
  const STATIC_WA = 'https://wa.me/5491161368107?text=Hola%20quiero%20consultar%20por%20los%20productos';
  const defaultMsg = encodeURIComponent('Hola, quiero consultar por un producto de TiendaOlivieriOnline');

  function scrollToCatalog(e){
    e && e.preventDefault();
    catalog.scrollIntoView({behavior:'smooth', block:'start'});
  }
  btnStore.addEventListener('click', scrollToCatalog);

  // Helper to build WhatsApp URL with product name
  function waLinkFor(name){
    // return static WhatsApp link (we keep function for compatibility)
    return STATIC_WA;
  }

  // Attach buy button handlers (delegated to support dynamic items)
  document.body.addEventListener('click', (e)=>{
    const btn = e.target.closest('.buy-btn');
    if(!btn) return;
    e.preventDefault();
    // open static WhatsApp link with preset message
    window.open(STATIC_WA, '_blank', 'noopener');
  });

  // Smooth reveal on scroll (intersection)
  const items = document.querySelectorAll('.product, .hero');
  const io = new IntersectionObserver((entries)=>{
    entries.forEach(entry=>{
      if(entry.isIntersecting){ entry.target.style.transform = 'translateY(0)'; entry.target.style.opacity = '1'; }
    });
  }, {threshold:0.12});
  items.forEach(it=>{
    it.style.transition = 'transform .6s cubic-bezier(.2,.9,.2,1), opacity .6s ease';
    it.style.transform = 'translateY(18px)';
    it.style.opacity = '0';
    io.observe(it);
  });

  // Replace site-wide WA links to include default message if blank and mark whatsapp buttons
  document.querySelectorAll('a[href^="https://wa.me/"]').forEach(a=>{
    try{
      const url = new URL(a.href);
      if(!url.searchParams.toString()){
        a.href = WA_BASE + defaultMsg;
      }
    }catch(e){}
    if(!a.classList.contains('whatsapp-btn')) a.classList.add('whatsapp-link');
  });

  // --- NUEVO CARRUSEL ESTÁTICO: independiente del catálogo, autoplay, loop y transiciones suaves ---
  const newTrack = document.getElementById('new-carousel-track');
  const newPrev = document.getElementById('new-prev');
  const newNext = document.getElementById('new-next');
  const overlayWA = document.getElementById('overlay-wa'); // reutiliza el overlay CTA ya presente
  const overlayTitleEl = document.querySelector('.carousel-overlay .overlay-title');
  const overlaySubEl = document.querySelector('.carousel-overlay .overlay-sub');

  // slider state
  let newIndex = 0;
  let newTimer = null;
  const NEW_AUTOPLAY_MS = 3500;
  const TRANSITION_MS = 600;

  // Read slides already present in DOM (we added six manual slides in HTML)
  const getNewSlides = ()=> Array.from(document.querySelectorAll('#new-carousel-track .new-slide'));

  // Initialize styles for the new carousel (fade/slide combination)
  function initNewCarouselStyles(){
    const track = document.getElementById('new-carousel-track');
    if(!track) return;
    track.style.display = 'flex';
    track.style.width = `${getNewSlides().length * 100}%`;
    track.style.transition = `transform ${TRANSITION_MS}ms cubic-bezier(.2,.9,.2,1)`;
    getNewSlides().forEach(slide=>{
      slide.style.flex = `0 0 ${100 / getNewSlides().length}%`;
      slide.style.position = 'relative';
      slide.style.overflow = 'hidden';
      slide.style.minHeight = '420px';
      slide.style.display = 'flex';
      slide.style.alignItems = 'center';
      slide.style.justifyContent = 'center';
      slide.style.background = 'transparent';
      const img = slide.querySelector('img');
      if(img){
        img.style.width = '100%';
        img.style.height = '100%';
        img.style.objectFit = 'cover';
        img.style.display = 'block';
      }
    });
    // overlay text kept as fixed; ensure it remains visible
    if(overlayTitleEl) overlayTitleEl.textContent = 'Bienvenido a Tienda Olivieri Online';
    if(overlaySubEl) overlaySubEl.textContent = 'Las mejores ofertas en productos seleccionados';
  }

  function showNewIndex(i, instant=false){
    const slides = getNewSlides();
    if(slides.length === 0) return;
    newIndex = ((i % slides.length) + slides.length) % slides.length;
    const track = document.getElementById('new-carousel-track');
    if(!track) return;
    if(instant) {
      track.style.transition = 'none';
    } else {
      track.style.transition = `transform ${TRANSITION_MS}ms cubic-bezier(.2,.9,.2,1)`;
    }
    track.style.transform = `translateX(-${newIndex * (100 / slides.length)}%)`;
    if(instant){
      requestAnimationFrame(()=> {
        track.style.transition = `transform ${TRANSITION_MS}ms cubic-bezier(.2,.9,.2,1)`;
      });
    }
    // update overlay WA to use current slide product name
    const current = slides[newIndex];
    const name = current?.dataset?.name || 'este producto';
    if(overlayWA){
      overlayWA.onclick = (e)=>{
        e.stopPropagation();
        window.open(STATIC_WA, '_blank', 'noopener');
      };
    }
  }

  function nextNew(){ showNewIndex(newIndex + 1); }
  function prevNew(){ showNewIndex(newIndex - 1); }

  function startNewAutoplay(){
    stopNewAutoplay();
    const slides = getNewSlides();
    if(slides.length <= 1) return;
    newTimer = setInterval(()=> nextNew(), NEW_AUTOPLAY_MS);
  }
  function stopNewAutoplay(){ if(newTimer) clearInterval(newTimer); newTimer = null; }

  // Wire controls and hover/touch behavior
  newNext?.addEventListener('click', (e)=>{ e.stopPropagation(); nextNew(); startNewAutoplay(); });
  newPrev?.addEventListener('click', (e)=>{ e.stopPropagation(); prevNew(); startNewAutoplay(); });

  const newCarouselEl = document.getElementById('new-carousel');
  newCarouselEl?.addEventListener('mouseenter', stopNewAutoplay);
  newCarouselEl?.addEventListener('mouseleave', startNewAutoplay);
  newCarouselEl?.addEventListener('touchstart', stopNewAutoplay, {passive:true});
  newCarouselEl?.addEventListener('touchend', startNewAutoplay, {passive:true});

  // allow clicking a slide to open modal by mapping slide -> modal content using slide dataset
  getNewSlides().forEach(slide=>{
    slide.style.cursor = 'pointer';
    slide.addEventListener('click', (ev)=>{
      // find product info in dataset and open modal using existing openModalFromCard logic but build a temp object
      const name = slide.dataset.name || slide.querySelector('img')?.alt || 'Producto';
      const price = slide.dataset.price || '';
      const desc = slide.dataset.desc || '';
      const src = slide.querySelector('img')?.src || '';

      // populate modal elements (reuse modal DOM nodes)
      const modal = document.getElementById('product-modal');
      const modalImg = document.getElementById('modal-img');
      const modalTitle = document.getElementById('modal-title');
      const modalPrice = document.getElementById('modal-price');
      const modalDesc = document.getElementById('modal-desc');
      const modalWhatsapp = document.getElementById('modal-whatsapp');

      if(modalImg) { modalImg.src = src; modalImg.alt = name; }
      if(modalTitle) modalTitle.textContent = name;
      if(modalPrice) modalPrice.textContent = price;
      if(modalDesc) modalDesc.textContent = desc;
      if(modalWhatsapp) modalWhatsapp.href = STATIC_WA;

      if(modal){
        modal.classList.add('open');
        modal.setAttribute('aria-hidden','false');
        document.body.style.overflow = 'hidden';
      }
    });
  });

  // Initialize new carousel on load
  if(newTrack){
    initNewCarouselStyles();
    showNewIndex(0, true);
    startNewAutoplay();
    // If window resizes, recalc widths (keeps transitions consistent)
    window.addEventListener('resize', ()=> {
      initNewCarouselStyles();
      showNewIndex(newIndex, true);
    });
  }

  // Product modal logic (keeps the same behavior)
  const modal = document.getElementById('product-modal');
  const modalImg = document.getElementById('modal-img');
  const modalTitle = document.getElementById('modal-title');
  const modalPrice = document.getElementById('modal-price');
  const modalDesc = document.getElementById('modal-desc');
  const modalWhatsapp = document.getElementById('modal-whatsapp');

  function openModalFromCard(card){
    const imgEl = card.querySelector('.prod-media img');
    const src = imgEl ? imgEl.src : '';
    const alt = imgEl ? imgEl.alt : '';
    const name = card.dataset.name || card.querySelector('.prod-name')?.textContent || 'Producto';
    const price = card.dataset.price || card.querySelector('.prod-price')?.textContent || '';

    modalImg.src = src;
    modalImg.alt = alt || name;
    modalTitle.textContent = name;
    modalPrice.textContent = price;
    // fill description from data-desc (hidden in catalog)
    const desc = card.dataset.desc || '';
    modalDesc.textContent = desc;

    // set modal buy link to WhatsApp URL including product name
    modalWhatsapp.href = STATIC_WA;

    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeModal(){
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  // Open modal when clicking anywhere on a product (except the internal buy button which opens WA separately)
  document.body.addEventListener('click', (e)=>{
    const card = e.target.closest('.product');
    if(!card) return;
    if(e.target.closest('.buy-btn')) return;
    openModalFromCard(card);
  });

  // Close handlers
  modal.addEventListener('click', (e)=>{
    if(e.target.matches('[data-close]') || e.target === modal) closeModal();
  });
  document.addEventListener('keydown', (e)=>{
    if(e.key === 'Escape' && modal.classList.contains('open')) closeModal();
  });

});