(function () {
  'use strict';
  const Store = window.RentalStore;
  const $ = (selector, context = document) => context.querySelector(selector);
  const $$ = (selector, context = document) => [...context.querySelectorAll(selector)];
  const icon = name => `<svg class="icon" aria-hidden="true"><use href="#i-${name}"/></svg>`;
  const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const rooms = {
    'emma-james': { id: 'emma-james', code: 'EJ2027', names: 'Emma & James', initials: ['E', 'J'], date: 'Saturday, June 12, 2027', shortDate: 'JUNE 12, 2027', location: 'The Glasshouse, St. Louis', shortLocation: 'THE GLASSHOUSE', dresscode: 'Garden formal', palette: 'Soft florals, pastels & a little romance', arrival: 'June 10, 2027', returnDate: 'June 14, 2027', reserved: ['d03'] },
    'olivia-noah': { id: 'olivia-noah', code: 'ON2027', names: 'Olivia & Noah', initials: ['O', 'N'], date: 'Saturday, August 21, 2027', shortDate: 'AUGUST 21, 2027', location: 'Seabrook House, Charleston', shortLocation: 'SEABROOK HOUSE', dresscode: 'Coastal cocktail', palette: 'Ocean blues, soft color & easy elegance', arrival: 'August 19, 2027', returnDate: 'August 23, 2027', reserved: ['d02'] }
  };
  const catalog = [
    { id: 'd01', name: 'Rosalie', color: 'Blush floral', swatch: '#d3a5a8', style: 'garden', tag: 'Garden romance', sizes: ['XS', 'S', 'M', 'L'], image: 'dress-01.jpg', alt: 'Blush floral flowing maxi dress photographed in a garden', description: 'Soft blush blooms and a flowing silhouette for a sunlit ceremony. A romantic maxi that brings a little garden magic to the celebration.', fit: 'A flowing skirt with a defined waist. Compare your bust and waist measurements when choosing a size.' },
    { id: 'd02', name: 'Something Blue', color: 'Powder blue', swatch: '#b8c9df', style: 'modern', tag: 'Modern classics', sizes: ['XS', 'S', 'M', 'L'], image: 'dress-02.jpg', alt: 'Powder blue tiered maxi occasion dress', description: 'A fresh powder-blue hue, soft tiers, and an easy sense of occasion. Lovely for a coastal reception or a summer celebration.', fit: 'A fitted upper body with a full tiered skirt. Check the bust measurement rather than sizing down for the skirt.' },
    { id: 'd03', name: 'Sage Serenade', color: 'Sage satin', swatch: '#a9b5a0', style: 'modern', tag: 'Modern classics', sizes: ['XS', 'S', 'M', 'L'], image: 'dress-03.jpg', alt: 'Sage satin tea-length dress with soft puff sleeves', description: 'Sage satin, soft sleeves, and a graceful tea-length skirt. A quietly lovely choice for garden settings and intimate ceremonies.', fit: 'A shaped waist and relaxed sleeve. For a comfortable fit, compare both bust and waist measurements.' },
    { id: 'd04', name: 'Afterglow', color: 'Burgundy satin', swatch: '#7c3747', style: 'evening', tag: 'Evening elegance', sizes: ['XS', 'S', 'M', 'L'], image: 'dress-04.jpg', alt: 'Burgundy satin midi dress with a draped neckline', description: 'Rich burgundy satin and a draped neckline, ready for candlelight and the dance floor. An understated evening statement.', fit: 'Satin follows the body. If you fall between sizes, consider the larger size for ease through the hips.' },
    { id: 'd05', name: 'Blue Hour', color: 'Cobalt blue', swatch: '#3f64ac', style: 'evening', tag: 'Evening elegance', sizes: ['S', 'M', 'L'], image: 'dress-05.jpg', alt: 'Cobalt blue pleated maxi dress', description: 'Cobalt color and beautiful movement. This pleated maxi brings a confident note to an evening wedding without stealing the occasion.', fit: 'A full pleated skirt and a defined bodice. Choose your size using the bust measurement.' },
    { id: 'd06', name: 'Petal Poetry', color: 'Dusty pink floral', swatch: '#bb858e', style: 'garden', tag: 'Garden romance', sizes: ['XS', 'S', 'M', 'L'], image: 'dress-06.jpg', alt: 'Dusty pink floral off-shoulder dress with a bow neckline and slit', description: 'Dusty pink florals and an off-shoulder bow neckline, with a skirt made for dancing. For guests who love a romantic detail.', fit: 'A fitted bodice with an open neckline. Take particular care with bust and waist measurements.' },
    { id: 'd07', name: 'Golden Garden', color: 'Butter yellow floral', swatch: '#dfd1a4', style: 'garden', tag: 'Garden romance', sizes: ['XS', 'S', 'M'], image: 'dress-07.jpg', alt: 'Pale yellow maxi dress with pink floral print', description: 'Soft butter yellow scattered with pink flowers. A joyful choice for a daytime ceremony, garden party, or golden-hour reception.', fit: 'A softly shaped bodice and flowing skirt. Compare the waist measurement for the closest fit.' },
    { id: 'd08', name: 'Olive Muse', color: 'Sage satin', swatch: '#8d9d7f', style: 'evening', tag: 'Evening elegance', sizes: ['XS', 'S', 'M', 'L'], image: 'dress-08.jpg', alt: 'Sage satin asymmetric one-shoulder maxi dress', description: 'An asymmetric neckline, a soft satin finish, and an elegant green hue. A clean silhouette for a celebration that carries into the evening.', fit: 'A close satin silhouette. Check hip and bust measurements, and allow a little room to move.' }
  ].map(dress => ({ ...dress, price: 79, status: 'available' }));
  const storageKey = id => `wedding-wardrobe:v1:${id}`;
  let storageWorks = true;
  const visitStates = Object.create(null);
  function stored(key) { if (!storageWorks) return null; try { return localStorage.getItem(key); } catch { storageWorks = false; return null; } }
  function write(key, value) { if (!storageWorks) return false; try { localStorage.setItem(key, value); return true; } catch { storageWorks = false; return false; } }
  function loadState(id) {
    if (storageWorks) {
      const raw = stored(storageKey(id));
      if (storageWorks) visitStates[id] = Store.readState(raw);
    }
    return visitStates[id] || (visitStates[id] = Store.emptyState());
  }
  let room = rooms[stored('wedding-wardrobe:room')] || rooms['emma-james'];
  let state = loadState(room.id);
  let filter = 'all';
  let currentDress = null;
  let selectedSize = '';
  let myTab = 'saved';
  let pendingCancellation = null;
  let lastBooking = null;
  let lookOpener = null;
  let toastTimer;

  function dressFor(id) {
    const dress = catalog.find(item => item.id === id);
    return dress ? { ...dress, status: room.reserved.includes(id) ? 'reserved' : 'available' } : null;
  }
  function toast(message) {
    $('#toast').textContent = message;
    $('#toast').classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => $('#toast').classList.remove('show'), 3300);
  }
  function persist(next) {
    state = next;
    visitStates[room.id] = state;
    if (!write(storageKey(room.id), JSON.stringify(state))) toast('Saved for this visit. Your browser is not allowing persistent storage.');
    updateCounts();
  }
  function updateCounts() { $('#saved-count').textContent = state.saved.filter(id => dressFor(id)).length; }
  function openDialog(dialog) { dialog.showModal(); document.body.style.overflow = 'hidden'; }
  function closeDialog(dialog) { dialog.close(); }
  $$('.dialog').forEach(dialog => {
    $('.dialog-close', dialog)?.addEventListener('click', () => closeDialog(dialog));
    dialog.addEventListener('close', () => {
      if (document.querySelector('dialog[open]')) return;
      document.body.style.overflow = '';
      if (dialog.id === 'look-dialog') {
        const originalIsUsable = lookOpener?.isConnected && !lookOpener.closest('dialog:not([open])');
        const target = originalIsUsable ? lookOpener : $(`.dress-card[data-id="${currentDress?.id}"] .dress-open`) || $('#my-looks-button');
        target.focus({ preventScroll: true });
      }
    });
    dialog.addEventListener('click', event => {
      if (event.target !== dialog) return;
      const rect = dialog.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) closeDialog(dialog);
    });
  });
  function renderRoom() {
    $('#room-names').textContent = room.names;
    $('#hero-room-names').textContent = room.names;
    $('#hero-room-date').textContent = `${room.shortDate} · ${room.shortLocation}`;
    $('#room-monogram').innerHTML = `${room.initials[0]}<span>&amp;</span>${room.initials[1]}`;
    $('#room-date').textContent = room.date;
    $('#room-location').textContent = room.location;
    $('#room-dresscode').textContent = room.dresscode;
    $('#room-palette').textContent = room.palette;
    updateCounts();
  }
  function renderCatalog() {
    const focused = document.activeElement;
    const focusAction = $('#dress-grid').contains(focused) ? ['data-save-look', 'data-open-look'].find(attribute => focused.hasAttribute(attribute)) : null;
    const focusId = focusAction && focused.getAttribute(focusAction);
    const search = $('#dress-search').value.trim().toLowerCase();
    const size = $('#size-filter').value;
    let dresses = catalog.filter(dress => (filter === 'all' || dress.style === filter) &&
      (size === 'all' || dress.sizes.includes(size)) &&
      `${dress.name} ${dress.color} ${dress.tag}`.toLowerCase().includes(search));
    if ($('#sort-filter').value === 'name') dresses.sort((a, b) => a.name.localeCompare(b.name));
    $('#look-count').textContent = `${dresses.length} ${dresses.length === 1 ? 'look' : 'looks'}, thoughtfully chosen`;
    $('#empty-catalog').hidden = dresses.length > 0;
    $('#dress-grid').innerHTML = dresses.map(dress => {
      const ownBooking = Store.isReserved(state, dress.id);
      const reserved = room.reserved.includes(dress.id);
      const saved = state.saved.includes(dress.id);
      const badge = ownBooking ? 'Reserved by you' : reserved ? 'Reserved for this wedding' : dress.tag;
      return `<article class="dress-card" data-id="${dress.id}"><div class="dress-image-wrap"><button class="dress-open" data-open-look="${dress.id}" aria-label="View ${escape(dress.name)} details"><img src="./assets/images/${dress.image}" alt="${escape(dress.alt)}" width="1100" height="1650" loading="lazy"></button><button class="save-look ${saved ? 'saved' : ''}" data-save-look="${dress.id}" aria-label="${saved ? 'Remove' : 'Save'} ${escape(dress.name)}${saved ? ' from saved looks' : ''}" aria-pressed="${saved}">${icon('heart')}</button><span class="dress-badge ${ownBooking ? 'yours' : reserved ? 'reserved' : ''}">${badge}</span></div><div class="dress-info"><div class="dress-info-top"><button class="dress-name" data-open-look="${dress.id}">${escape(dress.name)}</button><span class="dress-price">$${dress.price}</span></div><p class="dress-color"><span class="color-dot" style="background:${dress.swatch}"></span>${escape(dress.color)}</p><div class="dress-bottom"><span>${dress.sizes.join(' · ')}</span><span>4-day rental</span></div></div></article>`;
    }).join('');
    if (focusAction) $(`[${focusAction}="${focusId}"]`, $('#dress-grid'))?.focus({ preventScroll: true });
  }
  function saveLook(id) {
    if (!dressFor(id)) return;
    persist(Store.toggleSaved(state, id));
    renderCatalog();
    if ($('#my-looks-dialog').open) renderMyLooks();
    const saved = state.saved.includes(id);
    const lookSave = $('#look-content .look-save');
    if (lookSave && currentDress?.id === id) {
      lookSave.classList.toggle('saved', saved);
      lookSave.setAttribute('aria-pressed', String(saved));
      lookSave.setAttribute('aria-label', `${saved ? 'Remove' : 'Save'} ${currentDress.name}`);
    }
    toast(`${saved ? 'Added to your saved looks.' : 'Removed from your saved looks.'}${storageWorks ? '' : ' Saved for this visit only; browser storage is unavailable.'}`);
  }
  document.addEventListener('click', event => {
    const save = event.target.closest('[data-save-look]');
    if (save) { saveLook(save.dataset.saveLook); return; }
    const open = event.target.closest('[data-open-look]');
    if (open) {
      if ($('#my-looks-dialog').open) $('#my-looks-dialog').close();
      showLook(open.dataset.openLook, open);
    }
  });
  $$('.filter-chip').forEach(button => button.addEventListener('click', () => {
    filter = button.dataset.filter;
    $$('.filter-chip').forEach(chip => { chip.classList.toggle('active', chip === button); chip.setAttribute('aria-pressed', String(chip === button)); });
    renderCatalog();
  }));
  $('#dress-search').addEventListener('input', renderCatalog);
  $('#size-filter').addEventListener('change', renderCatalog);
  $('#sort-filter').addEventListener('change', renderCatalog);
  $('#clear-filters').addEventListener('click', () => {
    filter = 'all'; $('#dress-search').value = ''; $('#size-filter').value = 'all';
    $$('.filter-chip').forEach(chip => { chip.classList.toggle('active', chip.dataset.filter === 'all'); chip.setAttribute('aria-pressed', String(chip.dataset.filter === 'all')); });
    renderCatalog();
  });
  $('#change-wedding').addEventListener('click', () => { $('#room-error').hidden = true; $('#wedding-code').value = ''; openDialog($('#room-dialog')); });
  function switchRoom(id) {
    if (!rooms[id]) return;
    room = rooms[id];
    write('wedding-wardrobe:room', room.id);
    state = loadState(room.id);
    renderRoom(); renderCatalog();
    $('#room-dialog').close();
    toast(`Welcome to ${room.names}'s wedding room.`);
  }
  $('#room-form').addEventListener('submit', event => {
    event.preventDefault();
    const code = $('#wedding-code').value.replace(/[^a-z0-9]/gi, '').toUpperCase();
    const selected = Object.values(rooms).find(candidate => candidate.code === code);
    if (selected) { $('#wedding-code').removeAttribute('aria-invalid'); switchRoom(selected.id); }
    else { $('#room-error').textContent = 'Try EJ2027 or ON2027 to enter a sample wedding.'; $('#room-error').hidden = false; $('#wedding-code').setAttribute('aria-invalid', 'true'); }
  });
  $$('[data-room]').forEach(button => button.addEventListener('click', () => switchRoom(button.dataset.room)));

  function showLook(id, opener) {
    currentDress = dressFor(id);
    if (!currentDress) return;
    lookOpener = opener;
    selectedSize = '';
    $('#look-image').src = `./assets/images/${currentDress.image}`;
    $('#look-image').alt = currentDress.alt;
    renderLook();
    openDialog($('#look-dialog'));
    $('#look-dialog').scrollTop = 0;
  }
  function renderLook() {
    const dress = currentDress;
    const unavailable = dress.status === 'reserved' || Store.isReserved(state, dress.id);
    const saved = state.saved.includes(dress.id);
    const ownBooking = Store.isReserved(state, dress.id);
    $('#look-content').innerHTML = `<span class="eyebrow">${escape(dress.tag)} · ${escape(room.names)}</span><h2 id="look-title">${escape(dress.name)}</h2><p class="look-color"><span class="color-dot" style="background:${dress.swatch}"></span>${escape(dress.color)}</p><div class="look-price-row"><span class="look-price">$${dress.price}<small> / 4-day rental</small></span>${icon('flower')}</div><p class="look-include">Round-trip delivery &amp; standard cleaning included</p><p class="look-description">${escape(dress.description)}</p><p class="look-label">Choose your size</p><div class="size-options" id="size-options" role="group" aria-label="Choose a dress size">${['XS', 'S', 'M', 'L'].map(size => `<button data-size="${size}" ${!dress.sizes.includes(size) || unavailable ? 'disabled' : ''} aria-pressed="false" aria-label="Size ${size}${!dress.sizes.includes(size) ? ', unavailable' : ''}">${size}</button>`).join('')}</div><p class="field-error" id="size-error" hidden>Please choose an available size.</p><details class="size-guide"><summary>Fit notes &amp; size guide</summary><p>${escape(dress.fit)}</p><table><caption>Illustrative body measurements in inches</caption><thead><tr><th>Size</th><th>Bust</th><th>Waist</th><th>Hips</th></tr></thead><tbody><tr><td>XS</td><td>32–33</td><td>25–26</td><td>35–36</td></tr><tr><td>S</td><td>34–35</td><td>27–28</td><td>37–38</td></tr><tr><td>M</td><td>36–37</td><td>29–30</td><td>39–40</td></tr><tr><td>L</td><td>38–40</td><td>31–33</td><td>41–43</td></tr></tbody></table><p>Sample sizing only. A live rental would use verified measurements for each garment.</p></details><div class="look-actions"><button class="button button-primary" id="reserve-look-button" ${unavailable ? 'disabled' : ''}>${ownBooking ? 'Already reserved by you' : unavailable ? 'Reserved for this wedding' : 'Reserve this look'} ${!unavailable ? icon('arrow') : ''}</button><button class="look-save ${saved ? 'saved' : ''}" data-save-look="${dress.id}" aria-label="${saved ? 'Remove' : 'Save'} ${escape(dress.name)}" aria-pressed="${saved}">${icon('heart')}</button></div><p class="look-dates">${icon('truck')}<span>Arrives ${room.arrival}<br>Return by ${room.returnDate}</span></p><p class="demo-disclosure">Classroom preview. Garments and availability are illustrative. Try the flow without placing a real order or making a payment.</p>`;
    $$('#size-options button').forEach(button => button.addEventListener('click', () => {
      selectedSize = button.dataset.size;
      $$('#size-options button').forEach(item => { item.classList.toggle('selected', item === button); item.setAttribute('aria-pressed', String(item === button)); });
      $('#size-error').hidden = true;
    }));
    $('#reserve-look-button').addEventListener('click', () => {
      if (!selectedSize) { $('#size-error').hidden = false; $('#size-options button:not(:disabled)')?.focus(); return; }
      renderCheckout();
    });
  }
  function renderCheckout() {
    const dress = currentDress;
    $('#look-content').innerHTML = `<button class="back-button" id="back-to-look">${icon('arrow')}Back to the look</button><span class="eyebrow">A LITTLE SOMETHING TO LOOK FORWARD TO</span><h2 id="look-title">Make it<br><em>yours for the day.</em></h2><p class="look-color">${escape(room.names)} · ${escape(room.dresscode)}</p><div class="booking-summary"><span>${escape(dress.name)}<br><small>${escape(dress.color)} · Size ${selectedSize}</small></span><strong>$${dress.price}</strong></div><form class="booking-form" id="booking-form" novalidate><label for="guest-name">Guest name</label><input id="guest-name" name="name" autocomplete="name" maxlength="100" placeholder="Your name" aria-describedby="name-error"><p class="field-error" id="name-error" hidden></p><label for="guest-email">Email</label><input id="guest-email" name="email" type="email" autocomplete="email" maxlength="200" placeholder="you@example.com" aria-describedby="email-error"><p class="field-error" id="email-error" hidden></p><p class="demo-disclosure"><strong>Demo checkout — no payment.</strong><br>Your details and reservation stay in this browser. Nothing is sent to a store, and other devices cannot see or share your reservation.</p><p class="look-dates" style="margin-top:15px">${icon('truck')}<span>Delivery ${room.arrival} · Return ${room.returnDate}</span></p><p class="field-error" id="booking-error" hidden></p><button class="button button-primary" id="confirm-reservation">Confirm demo reservation · $${dress.price} ${icon('arrow')}</button></form>`;
    $('#back-to-look').addEventListener('click', () => {
      renderLook();
      const chosen = $(`#size-options button[data-size="${selectedSize}"]`);
      if (chosen) { chosen.classList.add('selected'); chosen.setAttribute('aria-pressed', 'true'); chosen.focus(); }
    });
    $('#booking-form').addEventListener('submit', event => {
      event.preventDefault();
      state = loadState(room.id);
      const input = { dressId: dress.id, size: selectedSize, name: $('#guest-name').value, email: $('#guest-email').value };
      const validation = Store.validateBooking(input, dressFor(dress.id), state);
      for (const field of ['name', 'email']) {
        $(`#${field}-error`).hidden = !validation.errors[field];
        $(`#${field}-error`).textContent = validation.errors[field] || '';
        $(`#guest-${field}`).setAttribute('aria-invalid', String(Boolean(validation.errors[field])));
      }
      $('#booking-error').hidden = !(validation.errors.availability || validation.errors.size || validation.errors.dressId);
      $('#booking-error').textContent = validation.errors.availability || validation.errors.size || validation.errors.dressId || '';
      if (!validation.valid) { if (validation.errors.name) $('#guest-name').focus(); else if (validation.errors.email) $('#guest-email').focus(); return; }
      const result = Store.reserveLook(state, input, dressFor(dress.id));
      persist(result.state);
      lastBooking = result.booking;
      renderCatalog();
      renderConfirmation(result.booking);
    });
    $('#guest-name').focus();
  }
  function renderConfirmation(booking) {
    const dress = dressFor(booking.dressId);
    $('#look-content').innerHTML = `<div class="confirmation-panel" id="confirmation-panel"><div class="confirmation-icon">${icon('check')}</div><span class="eyebrow">ONE LESS THING ON YOUR LIST</span><h2 id="look-title">Your look is<br><em>reserved.</em></h2><p>${escape(booking.name)}, you've made ${escape(dress.name)} yours for ${escape(room.names)}'s celebration in this demo.</p><dl class="confirmation-details"><div><dt>Your look</dt><dd>${escape(dress.name)} · ${escape(booking.size)}</dd></div><div><dt>Delivery</dt><dd>${room.arrival}</dd></div><div><dt>Return by</dt><dd>${room.returnDate}</dd></div><div><dt>Demo rental total</dt><dd>$${booking.price} · No charge</dd></div></dl><p class="demo-disclosure" style="margin-bottom:20px">Saved on this device only. No order, payment, or confirmation email has been sent.</p><button class="button button-primary" id="view-reservation">View my reservation ${icon('arrow')}</button><button class="text-link" id="download-receipt">Download demo receipt</button></div>`;
    $('#view-reservation').addEventListener('click', () => { $('#look-dialog').close(); showMyLooks('reservations'); });
    $('#download-receipt').addEventListener('click', () => downloadReceipt(booking));
    if (!storageWorks) $('.demo-disclosure', $('#confirmation-panel')).textContent = 'Saved for this visit only because browser storage is unavailable. Refreshing will clear it. No order, payment, or confirmation email has been sent.';
    $('#look-title').tabIndex = -1;
    $('#look-title').focus();
    $('#look-dialog').scrollTop = 0;
  }
  function showMyLooks(tab = 'saved') { myTab = tab; renderMyLooks(); openDialog($('#my-looks-dialog')); }
  $('#my-looks-button').addEventListener('click', () => showMyLooks('saved'));
  $$('[data-my-tab]').forEach(button => {
    button.id = `my-tab-${button.dataset.myTab}`;
    button.setAttribute('aria-controls', 'my-looks-list');
    button.addEventListener('click', () => { myTab = button.dataset.myTab; renderMyLooks(); });
    button.addEventListener('keydown', event => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      const tabs = $$('[data-my-tab]');
      const next = event.key === 'Home' ? tabs[0] : event.key === 'End' ? tabs[1] : tabs[(tabs.indexOf(button) + 1) % 2];
      myTab = next.dataset.myTab; renderMyLooks(); next.focus();
    });
  });
  function renderMyLooks() {
    const focusWithin = $('#my-looks-list').contains(document.activeElement);
    $('#my-looks-room').textContent = `${room.names} · ${room.date}`;
    $$('[data-my-tab]').forEach(button => { const active = button.dataset.myTab === myTab; button.setAttribute('aria-selected', String(active)); button.tabIndex = active ? 0 : -1; });
    $('#my-looks-list').setAttribute('aria-labelledby', `my-tab-${myTab}`);
    const items = myTab === 'saved' ? state.saved.map(dressFor).filter(Boolean) : state.bookings.map(booking => ({ ...dressFor(booking.dressId), booking })).filter(item => item.id);
    if (!items.length) {
      $('#my-looks-list').innerHTML = `<div class="mini-empty">${icon(myTab === 'saved' ? 'heart' : 'bag')}<h3>${myTab === 'saved' ? 'A lovely look is waiting.' : 'Your day, your future look.'}</h3><p>${myTab === 'saved' ? 'Tap a heart in the wedding edit to keep a favorite here.' : 'Choose a look and try a demo reservation to see it here.'}</p><button class="button button-outline" id="browse-from-my-looks">Browse the wedding edit</button></div>`;
      $('#browse-from-my-looks').addEventListener('click', () => { $('#my-looks-dialog').close(); $('#wedding-edit').scrollIntoView({ behavior: 'smooth' }); });
      if (focusWithin) $(`#my-tab-${myTab}`).focus();
      return;
    }
    $('#my-looks-list').innerHTML = items.map(dress => `<article class="mini-look"><img src="./assets/images/${dress.image}" alt="${escape(dress.alt)}" width="82" height="116"><div><h3>${escape(dress.name)}${dress.booking ? '<span class="preview-tag">Demo</span>' : ''}</h3><p>${escape(dress.color)}${dress.booking ? ` · Size ${escape(dress.booking.size)}<br>Delivery ${room.arrival} · $${dress.booking.price}` : ` · $${dress.price} / 4 days`}</p><div class="mini-actions"><button data-open-look="${dress.id}">View look</button>${dress.booking ? `<button data-cancel-booking="${escape(dress.booking.id)}">Cancel reservation</button><button data-receipt="${escape(dress.booking.id)}">Download receipt</button>` : `<button data-save-look="${dress.id}">Remove from saved</button>`}</div></div></article>`).join('');
    if (focusWithin) $(`#my-tab-${myTab}`).focus();
  }
  $('#my-looks-list').addEventListener('click', event => {
    const cancel = event.target.closest('[data-cancel-booking]');
    if (cancel) { pendingCancellation = cancel.dataset.cancelBooking; openDialog($('#cancel-dialog')); }
    const receipt = event.target.closest('[data-receipt]');
    if (receipt) { const booking = state.bookings.find(item => item.id === receipt.dataset.receipt); if (booking) downloadReceipt(booking); }
  });
  $('#keep-reservation').addEventListener('click', () => $('#cancel-dialog').close());
  $('#confirm-cancel').addEventListener('click', () => {
    state = loadState(room.id);
    persist(Store.cancelBooking(state, pendingCancellation));
    $('#cancel-dialog').close();
    renderCatalog(); renderMyLooks();
    toast('Demo reservation canceled. This look is available again.');
  });
  function downloadReceipt(booking) {
    const dress = dressFor(booking.dressId);
    const text = `THE WEDDING WARDROBE\nDEMO RESERVATION — NOT A REAL ORDER\n\nWedding: ${room.names}\nDate: ${room.date}\nGuest: ${booking.name}\nLook: ${dress.name}\nColor: ${dress.color}\nSize: ${booking.size}\nDelivery: ${room.arrival}\nReturn by: ${room.returnDate}\nIllustrative total: $${booking.price}\nAmount charged: $0\nReference: ${booking.id}\n\nThis reservation exists on your current device only. No payment, inventory lock, delivery, or email has been arranged.\n`;
    const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
    const link = document.createElement('a'); link.href = url; link.download = `wedding-wardrobe-${dress.id}-demo.txt`; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  $$('[data-open-info]').forEach(button => button.addEventListener('click', () => {
    const credits = button.dataset.openInfo === 'credits';
    $('#info-title').textContent = credits ? 'The people behind the pictures.' : 'The finer details.';
    $('#info-content').innerHTML = credits ? `<p>Photos are used as illustrative imagery for a classroom rental concept. Product names, sizes, pricing, and availability are demo data; photographs do not establish actual rental stock or a brand partnership.</p><h3>Wedding photography</h3><ul><li>Garden reception: <a href="https://www.pexels.com/photo/set-table-for-a-wedding-reception-12846017/" target="_blank" rel="noopener noreferrer">Jonathan Borba / Pexels</a></li><li>Garden table: <a href="https://www.pexels.com/photo/photo-of-a-wedding-table-in-the-garden-15283448/" target="_blank" rel="noopener noreferrer">Eugenia Remark / Pexels</a></li></ul><h3>Dress photography</h3><p>All eight dress photographs are from <a href="https://petalandpup.com/" target="_blank" rel="noopener noreferrer">Petal &amp; Pup</a>. Rights remain with their respective owners. Exact product pages are documented in <a href="./assets/image-credits.json" target="_blank" rel="noopener">the image source record</a>.</p><h3>Typography</h3><p>Bodoni Moda and DM Sans from Google Fonts. Local font files and source notes are bundled with the project.</p>` : `<h3>The proposed rental</h3><p>$79 for four days, including round-trip delivery and standard cleaning. The intended service sends a verified, clean garment two days before the wedding, with return instructions and a prepaid label.</p><h3>Fit and availability</h3><p>A live operator would confirm the actual garment, measurements, size, date, and shipping region before taking payment. The operator would keep one style/color exclusive within each wedding's platform orders.</p><h3>What this preview does</h3><p>You can explore two sample weddings, browse and filter eight illustrated looks, save favorites, reserve in a local demo, download a demo receipt, and cancel. No order is sent and no card information is requested.</p><h3>Your demo data</h3><p>Favorites, guest details, and demo reservations stay in this browser's local storage, separately for each wedding. They are not synced to other guests or devices. Clearing site data removes them.</p>`;
    openDialog($('#info-dialog'));
  }));
  window.addEventListener('storage', event => {
    if (event.key !== storageKey(room.id)) return;
    state = Store.readState(event.newValue); visitStates[room.id] = state; renderCatalog(); updateCounts();
    if ($('#my-looks-dialog').open) renderMyLooks();
  });
  renderRoom(); renderCatalog();
})();
