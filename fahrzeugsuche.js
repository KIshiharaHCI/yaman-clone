// ===== AUDARIS API CONFIG =====
const API_BASE = 'https://api.audaris.de/v1/clients/2396/website-vehicles';
const WEBSITE_ID = '6357a94781160e63a700a2de';

// ===== STATE =====
let allVehicles = [];
let filteredVehicles = [];
let activeFilters = {
  brand: null,
  search: '',
  fahrzeugart: '',
  modell: '',
  kraftstoff: [],
  getriebe: [],
  preisMin: 0,
  preisMax: 250000,
  jahrMin: 2000,
  jahrMax: 2026,
  kmMin: 0,
  kmMax: 300000,
  psMin: 0,
  psMax: 700
};
let currentSort = 'relevanz';

// ===== EQUIPMENT DATA =====
const equipmentCategories = [
  {
    name: 'Infotainment & Konnektivität',
    items: [
      'Head-up Display (HUD)', 'Virtual/Digital Cockpit', 'DAB', 'CD-Player',
      'Soundsystem', 'Telefon', 'Induktions-Ladestation', 'Phone Box',
      'Musikstreaming (integriert)', 'Wi-Fi/WLAN Hotspot', 'Navigationssystem',
      'Touchscreen', 'Sprachsteuerung', 'TV',
      'Connected Service/Vernetztes Fahrzeug', 'AUX-In', 'Navigationsvorbereitung'
    ]
  },
  {
    name: 'Fahrassistenz',
    items: [
      'ESP (Elektronisches Stabilitäts-Programm)', 'Stabilitätskontrolle',
      'ASC (Traktionskontrolle)', 'ASR (Antriebsschlupfregelung)',
      'Start-/Stopp-Automatik', 'Lichtsensor',
      'Regensensor/automatischer Scheibenwischer',
      'Geschwindigkeits-Regelanlage (Tempomat)',
      'Adaptiver Tempomat (ACC)', 'Totwinkel-Assistent',
      'Spurverlassenswarnung', 'Spurhalteassistent',
      'Notbremsassistent', 'Verkehrszeichenerkennung',
      'Nachtsichtassistent', 'Berganfahrassistent',
      'Müdigkeitserkennung'
    ]
  },
  {
    name: 'Sicherheit & Airbags',
    items: [
      'Fahrerairbag', 'Fahrer-/Beifahrer-Airbag', '4 Airbags',
      'Knie-Airbag', 'Beifahrer-Airbag ausschaltbar', 'Alarmanlage',
      'Notrufsystem', 'Bremsbelaganzeige'
    ]
  },
  {
    name: 'Parken & Kameras',
    items: [
      'Parklenkassistent', 'Einparkhilfe hinten', 'Einparkhilfe vorne',
      'Parkbremse elektrisch', 'Rückfahrkamera', '360 Grad Kamera/Area View',
      'Anhängerrangierassistent', 'Ausparkassistent'
    ]
  },
  {
    name: 'Klima & Komfort',
    items: [
      'Klimaanlage', 'Klimaautomatik', '2-Zonen-Klimaautomatik',
      '3-Zonen-Klimaautomatik', '4-Zonen-Klimaautomatik',
      'Standheizung', 'Sitzheizung', 'Lenkradheizung',
      'Außenspiegel elektrisch anklappbar', 'Elektrische Fensterheber',
      'Softclose'
    ]
  },
  {
    name: 'Sitze & Polster',
    items: [
      'Polsterstoff', 'Teilleder', 'Alcantara', 'Lederausstattung',
      'Sitzheizung vorne', 'Sitzheizung hinten', 'Sitzbelüftung',
      'Massage-Sitze', 'Sportsitze', 'Memory-Sitze',
      'Elektrisch verstellbare Sitze'
    ]
  }
];

// ===== HELPERS =====
function formatMakeDisplay(make) {
  if (!make || typeof make !== 'string') return String(make || '');
  const map = {
    'MERCEDES_BENZ': 'Mercedes-Benz',
    'BMW': 'BMW',
    'PORSCHE': 'Porsche',
    'AUDI': 'Audi',
    'LAND_ROVER': 'Land Rover',
    'VOLKSWAGEN': 'VW',
    'ALPINA': 'Alpina',
    'JAGUAR': 'Jaguar',
    'MASERATI': 'Maserati',
    'VOLVO': 'Volvo',
    'HYUNDAI': 'Hyundai',
    'KIA': 'Kia',
    'MAZDA': 'Mazda'
  };
  return map[make] || make.charAt(0) + make.slice(1).toLowerCase().replace(/_/g, ' ');
}

function formatFuel(fuel) {
  const map = {
    'PETROL': 'Benzin', 'DIESEL': 'Diesel', 'ELECTRIC': 'Elektro',
    'HYBRID': 'Hybrid', 'HYBRID_PETROL': 'Hybrid', 'HYBRID_DIESEL': 'Hybrid',
    'CNG': 'Erdgas', 'LPG': 'Autogas'
  };
  return map[fuel] || fuel;
}

function formatGearbox(gearbox) {
  const map = {
    'AUTOMATIC': 'Automatik', 'MANUAL': 'Schaltgetriebe',
    'AUTOMATIC_GEAR': 'Automatik', 'MANUAL_GEAR': 'Schaltgetriebe',
    'SEMIAUTOMATIC': 'Halbautomatik'
  };
  return map[gearbox] || gearbox;
}

function formatPrice(price) {
  if (!price && price !== 0) return 'Preis auf Anfrage';
  return Number(price).toLocaleString('de-DE') + ' €';
}

function formatMileage(km) {
  if (!km && km !== 0) return '–';
  return Number(km).toLocaleString('de-DE') + ' km';
}

function formatRegistration(dateStr) {
  if (!dateStr) return '–';
  // Handle ISO date or YYYYMM format
  if (dateStr.includes('-')) {
    const d = new Date(dateStr);
    return String(d.getMonth() + 1).padStart(2, '0') + '/' + d.getFullYear();
  }
  // YYYYMM format
  return dateStr.slice(4, 6) + '/' + dateStr.slice(0, 4);
}

function getVehicleTitle(v) {
  const make = v.manufacturerName || formatMakeDisplay(v.makeName || '');
  const model = v.modelName || v.modelGroupName || '';
  return `${make} ${model}`.trim();
}

function getVehicleSubtitle(v) {
  return v.modelDescription || v.subitle || v.subtitle || '';
}

function getCardImage(v) {
  if (v.images && v.images.length > 0) {
    return v.images[0].card || v.images[0].web || v.images[0].full || v.images[0].thumb_240 || '';
  }
  return '';
}

function getVehiclePrice(v) {
  return v.priceConsumer || v.price || v.priceRetail || 0;
}

function getVehiclePower(v) {
  return v.enginePower || v.power || 0;
}

function getVehicleMileage(v) {
  return v.mileage || v.mileageKm || 0;
}

function getVehicleYear(v) {
  const reg = v.registration || v.firstRegistration;
  if (reg) {
    if (typeof reg === 'string' && reg.includes('-')) {
      return new Date(reg).getFullYear();
    }
    return parseInt(String(reg).slice(0, 4));
  }
  return 0;
}

function getVehicleFuel(v) {
  if (v.fuels && v.fuels.length > 0) return v.fuels[0];
  return v.engineType || v.fuel || '';
}

function getVehicleGearbox(v) {
  return v.gearboxType || v.gearbox || '';
}

function getVehicleId(v) {
  return v.audaris_id || v._id || v.mobileAdId || '';
}

function kwToPs(kw) {
  return Math.round(kw * 1.36);
}

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  initMobileMenu();
  initEquipmentAccordion();
  initRangeSliders();
  initBrandGrid();
  initCheckboxes();
  initDropdowns();
  initFilterTags();
  initMobileSidebar();
  initSearch();
  initSort();
  loadVehicles();
});

// ===== LOAD VEHICLES FROM API =====
async function loadVehicles() {
  const grid = document.getElementById('carGrid');
  const loading = document.getElementById('carGridLoading');
  const empty = document.getElementById('carGridEmpty');

  try {
    // Fetch all vehicles (paginated)
    let all = [];
    let skip = 0;
    const limit = 100;
    let hasMore = true;

    while (hasMore) {
      const url = `${API_BASE}?website=${WEBSITE_ID}&sort[0][field]=isTop&sort[0][order]=DESC&limit=${limit}&skip=${skip}`;
      const resp = await fetch(url);
      if (!resp.ok) throw new Error(`API error: ${resp.status}`);
      const data = await resp.json();

      if (data.data && data.data.length > 0) {
        all = all.concat(data.data);
        skip += limit;
        hasMore = data.data.length === limit;
      } else {
        hasMore = false;
      }
    }

    // Deduplicate vehicles by ID and by content (same car with different IDs)
    const seenIds = new Set();
    const seenContent = new Set();
    const deduped = [];
    for (const v of all) {
      const id = v.audaris_id || v._id || v.mobileAdId || '';
      if (id && seenIds.has(id)) continue;

      // Content-based dedup: make+model+price+mileage+registration
      const contentKey = `${v.makeName || v.manufacturerName || ''}_${v.modelName || v.modelGroupName || ''}_${v.priceConsumer || v.price || ''}_${v.mileage || v.mileageKm || ''}_${v.registration || v.firstRegistration || ''}`;
      if (seenContent.has(contentKey)) continue;

      if (id) seenIds.add(id);
      seenContent.add(contentKey);
      deduped.push(v);
    }

    allVehicles = deduped;
    filteredVehicles = [...allVehicles];

    // Populate model dropdown
    populateModelDropdown();

    // Hide loading, render cards
    loading.style.display = 'none';
    applyFiltersAndRender();

  } catch (err) {
    console.error('Failed to load vehicles:', err);
    loading.innerHTML = '<p style="color: var(--gold);">Fehler beim Laden der Fahrzeuge. Bitte versuchen Sie es später erneut.</p>';
  }
}

// ===== RENDER CARDS =====
function renderCards(vehicles) {
  const grid = document.getElementById('carGrid');
  const empty = document.getElementById('carGridEmpty');
  const countEl = document.getElementById('resultsCount');

  grid.innerHTML = '';

  if (vehicles.length === 0) {
    empty.style.display = 'flex';
    countEl.textContent = 'Keine Fahrzeuge gefunden';
    return;
  }

  empty.style.display = 'none';
  countEl.textContent = `${vehicles.length} Fahrzeug${vehicles.length !== 1 ? 'e' : ''} gefunden`;

  vehicles.forEach(v => {
    const card = document.createElement('div');
    card.className = 'car-card';
    card.setAttribute('data-id', getVehicleId(v));

    const imgSrc = getCardImage(v);
    const title = getVehicleTitle(v);
    const subtitle = getVehicleSubtitle(v);
    const price = formatPrice(getVehiclePrice(v));
    const fuel = formatFuel(getVehicleFuel(v));
    const gearbox = formatGearbox(getVehicleGearbox(v));
    const power = getVehiclePower(v);
    const powerDisplay = power > 0 ? `${kwToPs(power)} PS` : '';
    const mileage = formatMileage(getVehicleMileage(v));
    const year = getVehicleYear(v);
    const reg = v.registration || v.firstRegistration;
    const yearDisplay = year > 0 ? `EZ ${formatRegistration(reg)}` : '';

    card.innerHTML = `
      <div class="car-card-image">
        <div class="car-card-badge">Gebrauchtwagen</div>
        ${imgSrc
        ? `<img src="${imgSrc}" alt="${title}" loading="lazy">`
        : `<div class="car-card-placeholder"><svg width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z"/></svg></div>`
      }
      </div>
      <div class="car-card-body">
        <h3 class="car-card-title">${title}</h3>
        <div class="car-card-subtitle">${subtitle}</div>
        <div class="car-card-price">${price}</div>
        <div class="car-card-specs">
          ${yearDisplay ? `<span>${yearDisplay}</span>` : ''}
          <span>${mileage}</span>
          ${powerDisplay ? `<span>${powerDisplay}</span>` : ''}
          <span>${fuel}</span>
          <span>${gearbox}</span>
        </div>
      </div>
    `;

    card.addEventListener('click', () => {
      window.location.href = `fahrzeug.html?id=${getVehicleId(v)}`;
    });
    card.style.cursor = 'pointer';

    grid.appendChild(card);
  });
}

// ===== FILTER & SORT =====
function applyFiltersAndRender() {
  let result = [...allVehicles];

  // Brand filter
  if (activeFilters.brand) {
    result = result.filter(v => {
      const make = v.manufacturerName || formatMakeDisplay(v.makeName || '');
      return make === activeFilters.brand;
    });
  }

  // Search
  if (activeFilters.search) {
    const q = activeFilters.search.toLowerCase();
    result = result.filter(v => {
      const searchable = `${getVehicleTitle(v)} ${getVehicleSubtitle(v)} ${formatFuel(getVehicleFuel(v))} ${formatGearbox(getVehicleGearbox(v))}`.toLowerCase();
      return searchable.includes(q);
    });
  }

  // Fuel filter
  if (activeFilters.kraftstoff.length > 0) {
    result = result.filter(v => {
      const fuel = formatFuel(getVehicleFuel(v));
      return activeFilters.kraftstoff.includes(fuel);
    });
  }

  // Gearbox filter
  if (activeFilters.getriebe.length > 0) {
    result = result.filter(v => {
      const gb = formatGearbox(getVehicleGearbox(v));
      return activeFilters.getriebe.includes(gb);
    });
  }

  // Model filter
  if (activeFilters.modell) {
    result = result.filter(v => {
      const model = v.modelName || v.modelGroupName || '';
      return model === activeFilters.modell;
    });
  }

  // Price range
  result = result.filter(v => {
    const p = getVehiclePrice(v);
    return p >= activeFilters.preisMin && p <= activeFilters.preisMax;
  });

  // Year range
  result = result.filter(v => {
    const y = getVehicleYear(v);
    if (y === 0) return true;
    return y >= activeFilters.jahrMin && y <= activeFilters.jahrMax;
  });

  // Mileage range
  result = result.filter(v => {
    const km = getVehicleMileage(v);
    return km >= activeFilters.kmMin && km <= activeFilters.kmMax;
  });

  // Power range (PS)
  result = result.filter(v => {
    const ps = kwToPs(getVehiclePower(v));
    if (ps === 0) return true;
    return ps >= activeFilters.psMin && ps <= activeFilters.psMax;
  });

  // Sort
  switch (currentSort) {
    case 'preis-asc':
      result.sort((a, b) => getVehiclePrice(a) - getVehiclePrice(b));
      break;
    case 'preis-desc':
      result.sort((a, b) => getVehiclePrice(b) - getVehiclePrice(a));
      break;
    case 'km-asc':
      result.sort((a, b) => getVehicleMileage(a) - getVehicleMileage(b));
      break;
    case 'jahr-desc':
      result.sort((a, b) => getVehicleYear(b) - getVehicleYear(a));
      break;
    default:
      // relevanz = default API order (isTop first)
      break;
  }

  filteredVehicles = result;
  renderCards(result);
}

function populateModelDropdown() {
  const select = document.getElementById('filterModell');
  const models = [...new Set(allVehicles.map(v => v.modelName || v.modelGroupName || '').filter(Boolean))].sort();
  select.innerHTML = '<option value="">Alle Modelle</option>';
  models.forEach(m => {
    select.innerHTML += `<option value="${m}">${m}</option>`;
  });
}

// ===== SEARCH INIT =====
function initSearch() {
  const mainSearch = document.getElementById('mainSearch');
  const sidebarSearch = document.getElementById('sidebarSearch');
  const searchBtn = document.querySelector('.search-btn');

  function doSearch() {
    activeFilters.search = mainSearch.value || sidebarSearch.value;
    applyFiltersAndRender();
  }

  mainSearch.addEventListener('input', () => {
    sidebarSearch.value = mainSearch.value;
    doSearch();
  });

  sidebarSearch.addEventListener('input', () => {
    mainSearch.value = sidebarSearch.value;
    doSearch();
  });

  searchBtn.addEventListener('click', doSearch);
  mainSearch.addEventListener('keydown', (e) => { if (e.key === 'Enter') doSearch(); });
}

// ===== SORT INIT =====
function initSort() {
  const sortSelect = document.getElementById('sortSelect');
  sortSelect.addEventListener('change', () => {
    currentSort = sortSelect.value;
    applyFiltersAndRender();
  });
}

// ===== NAVBAR =====
function initNavbar() {
  // Already has scrolled class on this page
}

// ===== MOBILE MENU =====
function initMobileMenu() {
  const hamburger = document.getElementById('hamburger');
  const menu = document.getElementById('mobileMenu');
  const closeBtn = document.getElementById('mobileClose');
  if (!hamburger || !menu) return;
  hamburger.addEventListener('click', () => menu.classList.add('open'));
  closeBtn.addEventListener('click', () => menu.classList.remove('open'));
  menu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => menu.classList.remove('open')));
}

// ===== EQUIPMENT ACCORDION =====
function initEquipmentAccordion() {
  const container = document.getElementById('equipmentAccordion');
  if (!container) return;

  equipmentCategories.forEach((cat, idx) => {
    const div = document.createElement('div');
    div.className = 'equipment-category';
    div.innerHTML = `
      <button class="equipment-header" data-idx="${idx}">
        <span>${cat.name}</span>
        <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7"/></svg>
      </button>
      <div class="equipment-body" id="eqBody${idx}">
        <div class="equipment-body-inner">
          ${cat.items.map(item => `
            <label class="custom-checkbox">
              <input type="checkbox" data-filter="ausstattung" value="${item}">
              <span class="checkmark"></span>
              ${item}
            </label>
          `).join('')}
        </div>
      </div>
    `;
    container.appendChild(div);
  });

  container.querySelectorAll('.equipment-header').forEach(btn => {
    btn.addEventListener('click', () => {
      const body = document.getElementById(`eqBody${btn.dataset.idx}`);
      const isOpen = body.style.maxHeight && body.style.maxHeight !== '0px';
      body.style.maxHeight = isOpen ? '0px' : body.scrollHeight + 'px';
      btn.classList.toggle('open', !isOpen);
    });
  });
}

// ===== RANGE SLIDERS =====
function initRangeSliders() {
  const sliders = [
    { id: 'sliderPreis', filterMin: 'preisMin', filterMax: 'preisMax', format: v => Number(v).toLocaleString('de-DE') + ' €' },
    { id: 'sliderJahr', filterMin: 'jahrMin', filterMax: 'jahrMax', format: v => v },
    { id: 'sliderKm', filterMin: 'kmMin', filterMax: 'kmMax', format: v => Number(v).toLocaleString('de-DE') + ' km' },
    { id: 'sliderPs', filterMin: 'psMin', filterMax: 'psMax', format: v => v + ' PS' }
  ];

  sliders.forEach(cfg => {
    const el = document.getElementById(cfg.id);
    if (!el) return;

    const minInput = el.querySelector('.range-min');
    const maxInput = el.querySelector('.range-max');
    const fill = el.querySelector('.range-fill');
    const minLabel = el.querySelector('.range-val-min');
    const maxLabel = el.querySelector('.range-val-max');

    function update() {
      let min = parseInt(minInput.value);
      let max = parseInt(maxInput.value);
      if (min > max) { [min, max] = [max, min]; }

      const range = parseInt(maxInput.max) - parseInt(minInput.min);
      const left = ((min - parseInt(minInput.min)) / range) * 100;
      const right = ((parseInt(maxInput.max) - max) / range) * 100;

      fill.style.left = left + '%';
      fill.style.right = right + '%';
      minLabel.textContent = cfg.format(min);
      maxLabel.textContent = cfg.format(max);
    }

    function onRelease() {
      let min = parseInt(minInput.value);
      let max = parseInt(maxInput.value);
      if (min > max) { [min, max] = [max, min]; }
      activeFilters[cfg.filterMin] = min;
      activeFilters[cfg.filterMax] = max;
      applyFiltersAndRender();
    }

    minInput.addEventListener('input', update);
    maxInput.addEventListener('input', update);
    minInput.addEventListener('mouseup', onRelease);
    maxInput.addEventListener('mouseup', onRelease);
    minInput.addEventListener('touchend', onRelease);
    maxInput.addEventListener('touchend', onRelease);

    update();
  });
}

// ===== BRAND GRID =====
function initBrandGrid() {
  document.querySelectorAll('.brand-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const brand = btn.dataset.brand;

      if (activeFilters.brand === brand) {
        activeFilters.brand = null;
        btn.classList.remove('active');
      } else {
        document.querySelectorAll('.brand-btn').forEach(b => b.classList.remove('active'));
        activeFilters.brand = brand;
        btn.classList.add('active');
      }

      applyFiltersAndRender();
    });
  });
}

// ===== CHECKBOXES =====
function initCheckboxes() {
  document.querySelectorAll('input[data-filter="kraftstoff"]').forEach(cb => {
    cb.addEventListener('change', () => {
      activeFilters.kraftstoff = [...document.querySelectorAll('input[data-filter="kraftstoff"]:checked')].map(c => c.value);
      applyFiltersAndRender();
    });
  });

  document.querySelectorAll('input[data-filter="getriebe"]').forEach(cb => {
    cb.addEventListener('change', () => {
      activeFilters.getriebe = [...document.querySelectorAll('input[data-filter="getriebe"]:checked')].map(c => c.value);
      applyFiltersAndRender();
    });
  });
}

// ===== DROPDOWNS =====
function initDropdowns() {
  const fahrzeugart = document.getElementById('filterFahrzeugart');
  const modell = document.getElementById('filterModell');

  if (fahrzeugart) {
    fahrzeugart.addEventListener('change', () => {
      activeFilters.fahrzeugart = fahrzeugart.value;
      applyFiltersAndRender();
    });
  }

  if (modell) {
    modell.addEventListener('change', () => {
      activeFilters.modell = modell.value;
      applyFiltersAndRender();
    });
  }
}

// ===== FILTER TAGS SYSTEM =====
const activeTags = new Map();

function initFilterTags() {
  const resetBtn = document.getElementById('filterReset');
  if (resetBtn) {
    resetBtn.addEventListener('click', resetAllFilters);
  }
}

function resetAllFilters() {
  activeFilters = {
    brand: null, search: '', fahrzeugart: '', modell: '',
    kraftstoff: [], getriebe: [],
    preisMin: 0, preisMax: 250000,
    jahrMin: 2000, jahrMax: 2026,
    kmMin: 0, kmMax: 300000,
    psMin: 0, psMax: 700
  };
  currentSort = 'relevanz';

  // Reset UI
  document.querySelectorAll('.brand-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('input[type="checkbox"]').forEach(cb => { cb.checked = false; });
  document.getElementById('mainSearch').value = '';
  document.getElementById('sidebarSearch').value = '';
  document.getElementById('sortSelect').value = 'relevanz';
  document.getElementById('filterFahrzeugart').value = '';
  document.getElementById('filterModell').value = '';

  // Reset sliders
  initRangeSliders();

  applyFiltersAndRender();
}

// ===== MOBILE SIDEBAR =====
function initMobileSidebar() {
  const toggle = document.getElementById('filterToggle');
  const sidebar = document.getElementById('filterSidebar');
  const closeBtn = document.getElementById('sidebarClose');
  if (!toggle || !sidebar) return;

  function openSidebar() {
    sidebar.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeSidebar() {
    sidebar.classList.remove('open');
    document.body.style.overflow = '';
  }

  toggle.addEventListener('click', openSidebar);
  closeBtn.addEventListener('click', closeSidebar);

  // Close on overlay click
  document.addEventListener('click', (e) => {
    if (sidebar.classList.contains('open') && !sidebar.contains(e.target) && e.target !== toggle) {
      closeSidebar();
    }
  });
}
