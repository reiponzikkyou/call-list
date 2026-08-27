// 軌跡を追加するときは、この配列へオブジェクトを1つ追加してください。
// date は並び替えに使うため YYYY.MM 形式で記述します。
const groupHistory = [
  // ▼ 追加用テンプレート（コピーしてコメント記号を外してください）
  /*
  {
    date: '20XX.XX',
    category: 'MILESTONE',
    title: '出来事のタイトル',
    description: '出来事の説明1行目\n出来事の説明2行目（不要ならこの行を削除）',
    image: 'images/example.jpg',
    imageAlt: '画像の説明'
  },
  */

  {
    date: '20XX.XX',
    category: 'MILESTONE',
    title: '新グループデビュー予定'
  },
  {
    date: '2026.08',
    category: 'MILESTONE',
    title: '新グループ準備期間',
    description: '櫻木まりあ/卯兎りりな/美羽優来の三人で活動を継続。\n準備期間限定の新衣装に加え、新曲「Sacrifice」を発表。\n同事務所のHIGH SPIRITSやアキシブprojectの楽曲をカバーしながら、新体制に向け実力を上げている。',

  },

];

const escapeHtml = (value = '') => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

function renderTimeline() {
  const timeline = document.getElementById('history-timeline');
  if (!timeline) return;

  const events = [...groupHistory].sort((a, b) => b.date.localeCompare(a.date));
  timeline.innerHTML = events.map((event, index) => {
    const image = event.image
      ? `<img class="history-image" src="${escapeHtml(event.image)}" alt="${escapeHtml(event.imageAlt)}" loading="lazy">`
      : '';
    const description = event.description
      ? `<p>${escapeHtml(event.description)}</p>`
      : '';

    return `
      <article class="history-event${index === 0 ? ' is-latest' : ''}">
        <div class="history-node" aria-hidden="true"></div>
        ${index === 0 ? '<span class="history-now">NOW</span>' : ''}
        <div class="history-card">
          <div class="history-card-main">
            <div class="history-meta">
              <time>${escapeHtml(event.date)}</time>
              <span class="history-category">${escapeHtml(event.category)}</span>
            </div>
            <h2>${escapeHtml(event.title)}</h2>
            ${description}
          </div>
          ${image}
        </div>
      </article>
    `;
  }).join('');

  installTimelineReveal();
}

function installTimelineReveal() {
  const cards = [...document.querySelectorAll('.history-event')];

  if (!('IntersectionObserver' in window)) {
    cards.forEach((card) => card.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries
      .filter((entry) => entry.isIntersecting)
      .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
      .forEach((entry, index) => {
        window.setTimeout(() => {
          entry.target.classList.add('is-visible');
        }, index * 110);
        observer.unobserve(entry.target);
      });
  }, {
    threshold: 0.14,
    rootMargin: '0px 0px -5% 0px'
  });

  cards.forEach((card) => observer.observe(card));
}

renderTimeline();
