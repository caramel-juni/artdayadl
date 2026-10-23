// One function per page that needs data.json. Each receives the parsed data.
import { $, el, img } from './dom.js';
import { CONFIG } from './config.js';
import { win, makeDesk, deskIcon } from './windows.js';
import { note } from './notes.js';

// ---- pins (home + notices) -------------------------------------------------

 // ---- pins (home + notices) -------------------------------------------------
const pin = (p) => {
  const b = el('button', 'pin ' + p.type);
  b.type = 'button';

  // Poster pins show the actual poster on the board.
  if (p.type === 'poster' && p.poster) {
    b.classList.add('poster-pin');
    b.setAttribute('aria-label', `${p.title} — open notice`);

    const img = el('img', 'poster-image');
    img.src = p.poster;
    img.alt = '';

    const tape = el('span', 'poster-tape');
    tape.setAttribute('aria-hidden', 'true');

    const caption = el('span', 'poster-caption', p.title);

    b.append(img, tape, caption);
  } else {
    // Default behaviour for ordinary sticky notes.
    b.append(
      el('span', 't', p.title),
      el('span', '', (p.body || '').slice(0, 70) + '…'),
      el('small', '', 'from ' + p.by)
    );
  }


  // Both types open the existing sticky-note dialog.
  b.onclick = () => {
    const content = [];

    // Show the poster inside the popup as well.
    if (p.type === 'poster' && p.poster) {
      const galleryImage = el('img', 'note-gallery-image');
      galleryImage.src = p.poster;
      galleryImage.alt = p.title || 'Event poster';
      galleryImage.loading = 'lazy';

      content.push(galleryImage);
    }

    // Existing notice text and author.
    if (p.body) {
      content.push(el('p', '', p.body));
    }

    if (p.by) {
      content.push(el('small', '', 'from ' + p.by));
    }

    note(
      p.title,
      content,
      p.type === 'poster' ? 'showcase' : p.type
    );
  };

  return b;


  return b;
};

const showPins = (pins) => pins.forEach((p) => $('#pins').append(pin(p)));

export function home(data) {
  const e = data.event;
  $('#poster').src = e.poster;
  $('#info').append(el('h2', '', e.title), el('p', '', e.date), el('p', '', e.place), el('p', '', e.details));
  showPins(data.pins.slice(0, CONFIG.homePins));
}

export const notices = (data) => showPins(data.pins);


 // ---- artist wall -----------------------------------------------------------
export function artists(data) {
  const wall = $('#wall');
  const oldestFirst = (a, b) => (a.added < b.added ? -1 : 1);
  let list = [...data.artists].sort(oldestFirst);

  // Short preview for the card; keep the full bio for the popup.
  const bioPreview = (text, maxLength = 120) => {
      const bio = (text || '').replace(/\s+/g, ' ').trim();
      if (bio.length <= maxLength) return bio;
      return bio.slice(0, maxLength).trimEnd() + '…';
  };

  
const card = (a) => {
  const c = el('button', 'card');
  c.type = 'button';

  // Use the portrait and gallery images as the preview carousel.
  const photos = [...new Set([
    a.img,
    ...(Array.isArray(a['gallery-imgs']) ? a['gallery-imgs'] : [])
  ].filter(Boolean))];

  let image;
  let current = 0;
  let timer;

  if (photos.length) {
    image = img(photos[0], a.name);
    image.classList.add('card-photo');
    c.append(image);
  }

  c.append(
    el('b', '', a.name),
    el('small', '', a.medium),
    el('span', 'bio', bioPreview(a.blurb))
  );

  // Cycle through photos while hovered.
  const stopCarousel = () => {
    clearInterval(timer);
    timer = undefined;
    current = 0;

    if (image) {
      image.src = photos[0];
      image.alt = a.name;
    }
  };

  c.addEventListener('mouseenter', () => {
    if (photos.length < 2 || timer) return;

    // Change immediately on hover.
    current = (current + 1) % photos.length;
    image.src = photos[current];
    image.alt = `${a.name} — photo ${current + 1}`;

    // Continue cycling every 1.2 seconds.
    timer = setInterval(() => {
      current = (current + 1) % photos.length;
      image.src = photos[current];
      image.alt = `${a.name} — photo ${current + 1}`;
    }, 1200);
  });

  c.addEventListener('mouseleave', stopCarousel);
  c.addEventListener('focus', () => {
    if (photos.length < 2 || timer) return;

    timer = setInterval(() => {
      current = (current + 1) % photos.length;
      image.src = photos[current];
      image.alt = `${a.name} — photo ${current + 1}`;
    }, 1200);
  });

  c.addEventListener('blur', stopCarousel);

  // Keep the full bio and gallery in the existing popup.
  c.onclick = () => {
    const content = [
      el('small', '', a.medium),
      ...(a.img ? [img(a.img, a.name)] : []),
      el('p', '', a.blurb || '')
    ];

    if (a.contact) {
        const contactSection = el('div', 'artist-contact');
        contactSection.append(el('h3', '', 'Contact details:'));

        if (a.contact.email) {
            const email = el('a', '', a.contact.email);
            email.href = `mailto:${a.contact.email}`;
            contactSection.append(email);
        }

        if (a.contact.instagram) {
            const instagram = el('a', '', 'Socials');
            instagram.href = a.contact.instagram;
            instagram.target = '_blank';
            instagram.rel = 'noopener noreferrer';
            contactSection.append(instagram);
        }

        if (a.contact.website) {
            const website = el('a', '', 'Website');
            website.href = a.contact.website;
            website.target = '_blank';
            website.rel = 'noopener noreferrer';
            contactSection.append(website);
        }

        content.push(contactSection);
    }

    if (Array.isArray(a['gallery-imgs']) && a['gallery-imgs'].length) {
      const gallery = el('div', 'artist-gallery');

      a['gallery-imgs'].forEach((src, i) => {
        gallery.append(img(src, `${a.name} — gallery image ${i + 1}`));
      });

      content.push(gallery);
      }

    note(a.name, content, 'artist');
  };

  return c;
};


  const draw = () => wall.replaceChildren(...list.map(card));

  $('#shuffle').onclick = () => {
    list.sort(() => Math.random() - 0.5);
    draw();
  };

  $('#order').onclick = () => {
    list.sort(oldestFirst);
    draw();
  };

  draw();
  autoScroll(wall);
}


// Slowly scroll the wall; pause on hover; loop at the end; skip if the visitor prefers reduced motion.
function autoScroll(wall) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  let hovering = false;
  wall.onmouseenter = () => { hovering = true; };
  wall.onmouseleave = () => { hovering = false; };
  setInterval(() => {
    if (hovering) return;
    wall.scrollLeft += CONFIG.wallScrollPx;
    if (wall.scrollLeft + wall.clientWidth >= wall.scrollWidth - 1) wall.scrollLeft = 0;
  }, CONFIG.wallTickMs);
}

// ---- photo archive: each past event is a folder icon that opens a photo-viewer window -----
export function archive(data) {
  const { desk, icons } = makeDesk($('#desk'));
  const open = {}; // one window per event

  const viewer = (event, x) => {
    if (open[event.title]?.isConnected) return open[event.title].up();
    const strip = el('div', 'strip');
    event.photos.forEach((src, i) => {
      const fig = el('figure');
      fig.append(img(src, `${event.title} photo ${i + 1}`), el('figcaption', '', `${i + 1} / ${event.photos.length}`));
      strip.append(fig);
    });
    const scroll = (dir) => () => strip.scrollBy({ left: dir * strip.clientWidth, behavior: 'smooth' });
    const prev = el('button', '', '◀ Prev'), next = el('button', '', 'Next ▶');
    prev.onclick = scroll(-1); next.onclick = scroll(1);
    const nav = el('div', 'navb'); nav.append(prev, next);
    open[event.title] = win(desk, `${event.title} - ${event.date}`, [el('p', '', event.note), strip, nav], { x, y: 20, w: 420 });
  };

  data.archive.forEach((ev) => deskIcon(icons, '📁', ev.title, () => viewer(ev, 160 + Math.random() * 80)));
  viewer(data.archive[0], 140); // open the newest event on arrival
}

// ---- contact: an "email" window. No server: Send opens the visitor's own mail app via mailto: ----
export function contact(data) {
  const { desk, icons } = makeDesk($('#desk'));
  const to = el('input'), subject = el('input'), message = el('textarea'), send = el('button', '', 'Send');
  to.value = data.contact; to.readOnly = true;
  subject.maxLength = 120; message.maxLength = 2000; send.type = 'button';

  const row = (label, field) => { const r = el('label', 'row'); r.append(el('span', '', label), field); return r; };
  send.onclick = () => {
    const bar = el('div', 'prog'); bar.append(el('i'));
    win(desk, 'Sending...', [el('p', '', 'Sending message...'), bar], { x: 100, y: 150, w: 260 });
    setTimeout(() => {
      location.href = `mailto:${data.contact}?subject=${encodeURIComponent(subject.value)}&body=${encodeURIComponent(message.value)}`;
    }, 1300);
  };

  let mailWindow;
  const openMail = () => mailWindow?.isConnected ? mailWindow.up()
    : (mailWindow = win(desk, 'New Message', [row('To:', to), row('Subject:', subject), message, el('p', '', 'Opens in your preferred email app :)'), send], { x: 40, y: 20, w: 420 }));
  deskIcon(icons, '📧', 'New Message', openMail);
  openMail();
}
