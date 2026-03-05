// ===== AUDARIS API CONFIG =====
const API_BASE = 'https://api.audaris.de/v1/clients/2396/website-vehicles';
const WEBSITE_ID = '6357a94781160e63a700a2de';

// ===== STATE =====
let currentImageIndex = 0;
let vehicleImages = [];

// ===== HELPERS =====
function formatMakeDisplay(make) {
    if (!make || typeof make !== 'string') return String(make || '');
    const map = {
        'MERCEDES_BENZ': 'Mercedes-Benz', 'BMW': 'BMW', 'PORSCHE': 'Porsche',
        'AUDI': 'Audi', 'LAND_ROVER': 'Land Rover', 'VOLKSWAGEN': 'VW',
        'ALPINA': 'Alpina', 'JAGUAR': 'Jaguar', 'MASERATI': 'Maserati',
        'VOLVO': 'Volvo', 'HYUNDAI': 'Hyundai', 'KIA': 'Kia', 'MAZDA': 'Mazda'
    };
    return map[make] || make.charAt(0) + make.slice(1).toLowerCase().replace(/_/g, ' ');
}

function formatFuel(fuel) {
    const map = {
        'PETROL': 'Benzin', 'DIESEL': 'Diesel', 'ELECTRIC': 'Elektro',
        'HYBRID': 'Hybrid', 'HYBRID_PETROL': 'Hybrid Benzin', 'HYBRID_DIESEL': 'Hybrid Diesel',
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

function formatDrivetrain(formula) {
    const map = { 'AWD': 'Allrad', 'RWD': 'Hinterrad', 'FWD': 'Vorderrad' };
    return map[formula] || formula || '–';
}

function formatPrice(price) {
    if (!price && price !== 0) return 'Preis auf Anfrage';
    return Number(price).toLocaleString('de-DE', { minimumFractionDigits: 0 }) + ',- €';
}

function formatRegistration(dateStr) {
    if (!dateStr) return '–';
    if (dateStr.includes('-')) {
        const d = new Date(dateStr);
        return String(d.getDate()).padStart(2, '0') + '.' +
            String(d.getMonth() + 1).padStart(2, '0') + '.' +
            d.getFullYear();
    }
    return dateStr.slice(4, 6) + '/' + dateStr.slice(0, 4);
}

function kwToPs(kw) {
    return Math.round(kw * 1.36);
}

function formatCategory(cats) {
    if (!cats || cats.length === 0) return '–';
    const catStr = cats[0];
    if (typeof catStr === 'string' && catStr.includes('\u001e')) {
        const parts = catStr.split('\u001e');
        const map = {
            'LIMOUSINE': 'Limousine', 'SUV': 'SUV', 'CABRIO': 'Cabriolet/Roadster',
            'COUPE': 'Coupé', 'KOMBI': 'Kombi', 'VAN': 'Van/Minibus',
            'KLEINWAGEN': 'Kleinwagen', 'TRANSPORTER': 'Transporter'
        };
        return map[parts[1]] || parts[1] || '–';
    }
    return catStr;
}

function formatEmissionStandard(std) {
    const map = {
        'EURO6D': 'Euro 6d', 'EURO6DTEMP': 'Euro 6d-TEMP', 'EURO6C': 'Euro 6c',
        'EURO6': 'Euro 6', 'EURO5': 'Euro 5', 'EURO4': 'Euro 4'
    };
    return map[std] || std || '–';
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
    initNavbar();
    initMobileMenu();
    loadVehicle();
});

// ===== NAVBAR =====
function initNavbar() {
    // Already scrolled on this page
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

// ===== LOAD VEHICLE =====
async function loadVehicle() {
    const params = new URLSearchParams(window.location.search);
    const vehicleId = params.get('id');

    const loadingEl = document.getElementById('detailLoading');
    const errorEl = document.getElementById('detailError');
    const pageEl = document.getElementById('detailPage');

    if (!vehicleId) {
        loadingEl.style.display = 'none';
        errorEl.style.display = 'flex';
        return;
    }

    try {
        // Fetch all vehicles and find by ID
        let vehicle = null;
        let skip = 0;
        const limit = 100;

        while (!vehicle) {
            const url = `${API_BASE}?website=${WEBSITE_ID}&sort[0][field]=isTop&sort[0][order]=DESC&limit=${limit}&skip=${skip}`;
            const resp = await fetch(url);
            if (!resp.ok) throw new Error(`API error: ${resp.status}`);
            const data = await resp.json();

            if (!data.data || data.data.length === 0) break;

            vehicle = data.data.find(v => (v.audaris_id || v._id) === vehicleId);
            skip += limit;
            if (data.data.length < limit) break;
        }

        if (!vehicle) {
            loadingEl.style.display = 'none';
            errorEl.style.display = 'flex';
            return;
        }

        // Show page, populate data
        loadingEl.style.display = 'none';
        pageEl.style.display = 'block';
        populateVehicle(vehicle);

    } catch (err) {
        console.error('Failed to load vehicle:', err);
        loadingEl.innerHTML = '<p style="color: var(--gold);">Fehler beim Laden des Fahrzeugs.</p><a href="fahrzeugsuche.html" style="color: var(--gold);">&larr; Zurück</a>';
    }
}

// ===== POPULATE VEHICLE DATA =====
function populateVehicle(v) {
    const make = v.manufacturerName || formatMakeDisplay(v.makeName || '');
    const model = v.modelName || v.modelGroupName || '';
    const title = `${make} ${model}`;
    const subtitle = v.modelDescription || v.subitle || v.subtitle || '';

    // Page title
    document.title = `${title} - Yaman Exclusive Automobile`;

    // Breadcrumb
    document.getElementById('breadcrumbTitle').textContent = title;

    // Title section
    const titleEl = document.getElementById('vehicleTitle');
    titleEl.innerHTML = `<span>${make}</span> ${model}`;
    document.getElementById('vehicleSubtitle').textContent = subtitle;

    // Price
    const price = v.priceConsumer || v.price || v.priceRetail || 0;
    document.getElementById('vehiclePrice').textContent = formatPrice(price);

    // Tax info
    const taxEl = document.getElementById('priceTax');
    if (v.taxRate && v.taxRate > 0) {
        taxEl.textContent = `inkl. ${v.taxRate}% MwSt.`;
    } else {
        taxEl.textContent = 'Mehrwertsteuer nicht ausweisbar';
    }

    // Vehicle number
    const nrEl = document.getElementById('vehicleNr');
    if (v.internalNumber) {
        nrEl.textContent = `Nr. ${v.internalNumber}`;
    }

    // Images
    populateGallery(v.images || []);

    // Specs
    populateSpecs(v);

    // Equipment
    populateEquipment(v);
}

// ===== IMAGE GALLERY =====
function populateGallery(images) {
    vehicleImages = images;
    currentImageIndex = 0;

    const mainImg = document.getElementById('galleryMainImg');
    const thumbsContainer = document.getElementById('galleryThumbs');
    const counter = document.getElementById('galleryCounter');
    const prevBtn = document.getElementById('galleryPrev');
    const nextBtn = document.getElementById('galleryNext');

    if (images.length === 0) {
        mainImg.style.display = 'none';
        prevBtn.style.display = 'none';
        nextBtn.style.display = 'none';
        counter.style.display = 'none';
        return;
    }

    // Set main image
    mainImg.src = images[0].web || images[0].full || images[0].card || '';
    mainImg.alt = 'Fahrzeugbild';
    counter.textContent = `1 / ${images.length}`;

    // Build thumbnails
    thumbsContainer.innerHTML = '';
    images.forEach((img, idx) => {
        const thumb = document.createElement('div');
        thumb.className = 'gallery-thumb' + (idx === 0 ? ' active' : '');
        thumb.innerHTML = `<img src="${img.thumb_240 || img.card || img.web || ''}" alt="Bild ${idx + 1}" loading="lazy">`;
        thumb.addEventListener('click', () => goToImage(idx));
        thumbsContainer.appendChild(thumb);
    });

    // Nav buttons
    prevBtn.addEventListener('click', () => goToImage(currentImageIndex - 1));
    nextBtn.addEventListener('click', () => goToImage(currentImageIndex + 1));

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') goToImage(currentImageIndex - 1);
        if (e.key === 'ArrowRight') goToImage(currentImageIndex + 1);
    });
}

function goToImage(idx) {
    if (vehicleImages.length === 0) return;

    // Wrap around
    if (idx < 0) idx = vehicleImages.length - 1;
    if (idx >= vehicleImages.length) idx = 0;

    currentImageIndex = idx;
    const img = vehicleImages[idx];
    const mainImg = document.getElementById('galleryMainImg');
    const counter = document.getElementById('galleryCounter');

    mainImg.src = img.web || img.full || img.card || '';
    counter.textContent = `${idx + 1} / ${vehicleImages.length}`;

    // Update thumbnails
    document.querySelectorAll('.gallery-thumb').forEach((t, i) => {
        t.classList.toggle('active', i === idx);
    });

    // Scroll active thumbnail into view
    const activeThumb = document.querySelectorAll('.gallery-thumb')[idx];
    if (activeThumb) {
        activeThumb.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
}

// ===== SPECS =====
function populateSpecs(v) {
    const grid = document.getElementById('specsGrid');
    const specs = [];

    // Registration
    if (v.registration || v.firstRegistration) {
        specs.push({ label: 'EZ', value: formatRegistration(v.registration || v.firstRegistration) });
    }

    // Fuel
    const fuel = v.fuels && v.fuels.length > 0 ? v.fuels[0] : v.engineType;
    if (fuel) {
        let fuelStr = formatFuel(fuel);
        if (v.emissionStandard) fuelStr += ` | ${formatEmissionStandard(v.emissionStandard)}`;
        specs.push({ label: 'Kraftstoff', value: fuelStr });
    }

    // Mileage
    if (v.mileage || v.mileageKm) {
        const km = v.mileage || v.mileageKm;
        specs.push({ label: 'Kilometerstand', value: Number(km).toLocaleString('de-DE') + ' km' });
    }

    // Power
    if (v.enginePower) {
        specs.push({ label: 'Leistung', value: `${v.enginePower} kW (${kwToPs(v.enginePower)} PS)` });
    }

    // Category / Body
    if (v.categories && v.categories.length > 0) {
        specs.push({ label: 'Karosserieform', value: formatCategory(v.categories) });
    }

    // Engine
    if (v.numberOfCylinders && v.engineSize) {
        specs.push({ label: 'Motor', value: `${v.numberOfCylinders} Zylinder | ${Number(v.engineSize).toLocaleString('de-DE')} cm³` });
    }

    // Exterior color
    if (v.exteriorColorName) {
        specs.push({ label: 'Farbe', value: v.exteriorColorName });
    }

    // Gearbox
    if (v.gearboxType) {
        specs.push({ label: 'Getriebe', value: formatGearbox(v.gearboxType) });
    }

    // Interior
    if (v.interiorColorName) {
        specs.push({ label: 'Interieur', value: v.interiorColorName });
    }

    // Drivetrain
    if (v.wheelFormula) {
        specs.push({ label: 'Antrieb', value: formatDrivetrain(v.wheelFormula) });
    }

    // Seats
    if (v.numberOfSeats) {
        specs.push({ label: 'Sitze', value: v.numberOfSeats });
    }

    // Doors
    if (v.numberOfDoors) {
        specs.push({ label: 'Türen', value: v.numberOfDoors });
    }

    // Location
    if (v.locationName) {
        specs.push({ label: 'Standort', value: v.locationName });
    }

    // Internal number
    if (v.internalNumber) {
        specs.push({ label: 'Fahrzeug-Nr.', value: v.internalNumber });
    }

    grid.innerHTML = specs.map(s => `
    <div class="spec-item">
      <span class="spec-label">${s.label}</span>
      <span class="spec-value">${s.value}</span>
    </div>
  `).join('');
}

// ===== EQUIPMENT =====
function populateEquipment(v) {
    const section = document.getElementById('equipmentSection');
    const list = document.getElementById('equipmentList');

    // Try parsing description HTML for equipment
    if (v.description) {
        const items = parseEquipmentFromDescription(v.description);
        if (items.length > 0) {
            section.style.display = 'block';
            list.innerHTML = items.map(item => `<div class="equipment-item">${item}</div>`).join('');
            return;
        }
    }

    // If no description, hide section
    section.style.display = 'none';
}

function parseEquipmentFromDescription(html) {
    // Create a temporary div to parse HTML
    const tmp = document.createElement('div');
    // Unescape the description (it may be double-escaped)
    let decoded = html;
    try {
        decoded = JSON.parse('"' + html.replace(/"/g, '\\"') + '"');
    } catch (e) {
        // If it fails, use as-is
    }
    tmp.innerHTML = decoded;

    const items = [];
    tmp.querySelectorAll('li').forEach(li => {
        const text = li.textContent.trim();
        if (text && text.length > 2 && !text.includes('Zwischenverkauf') && !text.includes('Fahrzeugbeschreibung dient')) {
            items.push(text);
        }
    });

    return items;
}
