// 軌跡を追加するときは、この配列へオブジェクトを1つ追加してください。
// date は並び替えに使うため YYYY.MM 形式で記述します。
const groupHistory = [
  {
    date: '20XX.XX',
    category: 'MILESTONE',
    title: '新グループデビュー予定'
  }
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
}

renderTimeline();
