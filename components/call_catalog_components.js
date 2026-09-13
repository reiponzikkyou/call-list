(function() {
  'use strict';

  const categoryLabels = { basic: '基本MIX', neta: 'ネタ系MIX',  koujou: '口上系', variable: '可変・連結系MIX'  };
  const songUsage = {
    'スタンダードMIX': [['Sacrifice', 'songs/Sacrifice.html'], ['FAKE Me', 'songs/FAKE Me.html'], ['UGLY DOLL', 'songs/UGLY DOLL.html']],
    'アイヌ語MIX': [['ハグバグ', 'songs/ハグバグ.html'], ['僕とボク', 'songs/僕とボク.html'], ['絶対らゔぃちゅ♡', 'songs/絶対らゔぃちゅ♡.html']],
    'アッチェレ': [['UGLY DOLL', 'songs/UGLY DOLL.html']], 'ホグワーツMIX': [['UGLY DOLL', 'songs/UGLY DOLL.html']],
    'ビスマルク口上': [['僕とボク', 'songs/僕とボク.html']], '銀河口上＋ファボリアスター': [['残り火', 'songs/残り火.html']],
    '花火MIX': [['私、私に恋してる', 'songs/私、私に恋してる.html']], '可変三連MIX': [['Chu♡Key×Chu♡Key', 'songs/Chu♡Key×Chu♡Key.html']],
    '転調MIX': [['僕とボク', 'songs/僕とボク.html']], 'ワールドカオス（＋逆打ち）': [['残り火', 'songs/残り火.html'], ['ハグバグ', 'songs/ハグバグ.html']],
    'キャプテン翼MIX': [['残り火', 'songs/残り火.html']]
  };

  function cloneCatalog() { return (window.CallCatalog?.all || []).map((entry) => ({ ...entry })); }

  function serializeCatalog(entries) {
    return '// コールまとめ・制作・楽曲ページで共有する一覧。id は変更しないでください。\nwindow.CALL_CATALOG = ' + JSON.stringify(entries, null, 2) + ';\n\n' +
      '// サイト共通のコール台帳API。\n// 楽曲ページでは本文を複製せず mixId を保存し、表示時にこの台帳から名前と本文を解決する。\n' +
      'window.CallCatalog = Object.freeze({\n  all: window.CALL_CATALOG,\n  get: function(id) {\n    return window.CALL_CATALOG.find(function(entry) { return entry.id === id; }) || null;\n  },\n  search: function(query) {\n    var normalized = String(query || \'\').trim().toLocaleLowerCase();\n    if (!normalized) return window.CALL_CATALOG.slice();\n    return window.CALL_CATALOG.filter(function(entry) {\n      return (entry.name + \'\\n\' + entry.call + \'\\n\' + entry.category).toLocaleLowerCase().includes(normalized);\n    });\n  }\n});\n';
  }

  class CallCatalogList extends HTMLElement {
    connectedCallback() { if (!this._entries) this._entries = cloneCatalog(); this.render(); }
    set entries(value) { this._entries = value || []; if (this.isConnected) this.render(); }
    get entries() { return this._entries || []; }

    createCard(entry, isDerived) {
      const card = document.createElement('article'); card.className = 'mix-card'; card.id = entry.id;
      if (isDerived) { const badge = document.createElement('span'); badge.className = 'mix-derived-label'; badge.textContent = '派生'; card.appendChild(badge); }
      const name = document.createElement('h3'); name.className = 'mix-name'; name.textContent = entry.name;
      const detail = document.createElement('div'); detail.className = 'mix-detail';
      const words = document.createElement('p'); words.className = 'mix-words'; words.textContent = entry.call; detail.appendChild(words);
      card.append(name, detail);
      if (this.hasAttribute('show-usage')) {
        const usage = document.createElement('aside'); const songs = songUsage[entry.name] || []; usage.className = 'mix-used-in';
        usage.innerHTML = `<span class="mix-used-in-label">このサイトで使う曲</span>${songs.length ? songs.map(([title, href]) => `<a href="${href}">${title}</a>`).join('') : '<span class="mix-used-in-empty">未登録</span>'}`;
        card.appendChild(usage);
      }
      if (this.hasAttribute('editable')) {
        const edit = document.createElement('button'); edit.className = 'mix-edit-button'; edit.type = 'button'; edit.textContent = 'このコールを編集';
        edit.addEventListener('click', () => this.dispatchEvent(new CustomEvent('catalog-edit', { bubbles: true, detail: { id: entry.id } })));
        card.appendChild(edit);
      }
      return card;
    }

    createFamily(base) {
      const entries = [base, ...this.entries.filter((entry) => entry.baseId === base.id)];
      const family = document.createElement('div'); family.className = 'mix-family';
      const track = document.createElement('div'); track.className = 'mix-family-track'; track.tabIndex = entries.length > 1 ? 0 : -1;
      entries.forEach((entry, index) => track.appendChild(this.createCard(entry, index > 0))); family.appendChild(track);
      if (entries.length > 1) {
        family.classList.add('has-variants'); const sets = [];
        const current = () => Math.round(track.scrollLeft / (track.clientWidth || 1));
        const updateHeight = () => {
          const activeCard = track.children[current()];
          if (activeCard) track.style.height = activeCard.offsetHeight + 'px';
        };
        const update = () => {
          sets.forEach(({ previous, next }) => { previous.disabled = current() === 0; next.disabled = current() === entries.length - 1; });
          updateHeight();
        };
        const move = (delta) => track.scrollTo({ left: Math.max(0, Math.min(entries.length - 1, current() + delta)) * track.clientWidth, behavior: 'smooth' });
        track.querySelectorAll('.mix-card').forEach((card) => {
          const controls = document.createElement('div'); controls.className = 'mix-family-controls';
          const previous = document.createElement('button'); previous.type = 'button'; previous.textContent = '← 前のコール'; previous.addEventListener('click', () => move(-1));
          const next = document.createElement('button'); next.type = 'button'; next.textContent = '次の派生 →'; next.addEventListener('click', () => move(1));
          controls.append(previous, next); card.appendChild(controls); sets.push({ previous, next });
        });
        track.addEventListener('scroll', update); track.addEventListener('keydown', (event) => { if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') { event.preventDefault(); move(event.key === 'ArrowRight' ? 1 : -1); } });
        if (window.ResizeObserver) {
          const observer = new ResizeObserver(updateHeight);
          track.querySelectorAll('.mix-card').forEach((card) => observer.observe(card));
        } else {
          window.addEventListener('resize', updateHeight);
        }
        requestAnimationFrame(update);
      }
      return family;
    }

    render() {
      this.classList.add('mix-list'); this.replaceChildren();
      Object.entries(categoryLabels).forEach(([category, label]) => {
        const bases = this.entries.filter((entry) => entry.category === category && !entry.baseId); if (!bases.length) return;
        const group = document.createElement('section'); group.className = 'mix-category';
        const title = document.createElement('h3'); title.className = 'mix-category-title'; title.textContent = label; group.appendChild(title);
        bases.forEach((base) => group.appendChild(this.createFamily(base))); this.appendChild(group);
      });
    }
  }

  class CallCatalogEditor extends HTMLElement {
    connectedCallback() {
      this.entries = cloneCatalog();
      this.innerHTML = `<section class="content-section" aria-labelledby="mix-register-title"><div class="section-header"><div><span class="section-number">EDIT</span><h2 id="mix-register-title">コールを登録・編集</h2></div><span class="section-label">Local tool</span></div><div class="mix-register-layout"><form class="mix-register-form"><input type="hidden" data-field="id"><label>コール名<input data-field="name" type="text" required placeholder="例：スタンダードMIX"></label><label>カテゴリー<select data-field="category" required>${Object.entries(categoryLabels).map(([id, name]) => `<option value="${id}">${name}</option>`).join('')}</select></label><label>派生元<select data-field="base"><option value="">基本形として登録</option></select><small>短縮・延長・本家などの場合、その基本形を選択します。</small></label><label>コール内容<textarea data-field="call" required rows="6" placeholder="実際に発声する内容"></textarea></label><label>参考動画URL<input data-field="video" type="url" placeholder="https://www.youtube.com/..."></label><div class="mix-register-actions"><button class="btn btn-primary" type="submit" data-action="submit">一覧に追加</button><button class="btn mix-register-secondary" type="button" data-action="reset">入力をクリア</button></div></form><div class="mix-register-preview"><span class="mix-register-preview-label">PREVIEW</span><article class="mix-card"><h3 class="mix-name" data-preview="name">コール名</h3><div class="mix-detail"><p class="mix-words" data-preview="call">入力したコール内容がここに表示されます。</p></div></article></div></div><div class="mix-export-bar"><div><strong>更新用JSを出力</strong><span>現在の一覧を含む call-catalog.js の全文をコピーします。</span></div><button class="btn btn-primary" type="button" data-action="copy">JS全文をコピー</button></div><p class="mix-register-status" data-status role="status" aria-live="polite"></p></section>`;
      this.form = this.querySelector('form'); this.fields = Object.fromEntries([...this.querySelectorAll('[data-field]')].map((el) => [el.dataset.field, el])); this.status = this.querySelector('[data-status]');
      this.populateBases(); ['name', 'call'].forEach((key) => this.fields[key].addEventListener('input', () => this.preview()));
      this.fields.category.addEventListener('change', () => this.populateBases());
      this.querySelector('[data-action="reset"]').addEventListener('click', () => this.reset()); this.querySelector('[data-action="copy"]').addEventListener('click', () => this.copy());
      this.form.addEventListener('submit', (event) => this.save(event)); this.preview();
    }
    populateBases() { const selected = this.fields.base.value; const category = this.fields.category.value; this.fields.base.replaceChildren(new Option('基本形として登録', '')); this.entries.filter((entry) => !entry.baseId && entry.id !== this.fields.id.value && entry.category === category).forEach((entry) => this.fields.base.add(new Option(entry.name, entry.id))); this.fields.base.value = selected; }
    preview() { this.querySelector('[data-preview="name"]').textContent = this.fields.name.value.trim() || 'コール名'; this.querySelector('[data-preview="call"]').textContent = this.fields.call.value.trim() || '入力したコール内容がここに表示されます。'; }
    reset() { this.form.reset(); this.fields.id.value = ''; this.querySelector('[data-action="submit"]').textContent = '一覧に追加'; this.populateBases(); this.preview(); }
    edit(id) { const entry = this.entries.find((item) => item.id === id); if (!entry) return; Object.keys(this.fields).forEach((key) => { if (key !== 'base') this.fields[key].value = entry[key] || ''; }); this.populateBases(); this.fields.base.value = entry.baseId || ''; this.querySelector('[data-action="submit"]').textContent = '変更を一覧に反映'; this.status.textContent = id + ' を編集中です。'; this.preview(); this.scrollIntoView({ behavior: 'smooth' }); }
    save(event) { event.preventDefault(); const id = this.fields.id.value || 'mix-' + (this.entries.reduce((max, entry) => Math.max(max, Number(entry.id.replace(/^mix-/, '')) || 0), 0) + 1); const entry = { id, category: this.fields.category.value, name: this.fields.name.value.trim(), call: this.fields.call.value.trim(), video: this.fields.video.value.trim() }; if (this.fields.base.value) entry.baseId = this.fields.base.value; const index = this.entries.findIndex((item) => item.id === id); if (index < 0) this.entries.push(entry); else this.entries[index] = entry; this.reset(); this.status.textContent = entry.name + ' を反映しました。'; this.dispatchEvent(new CustomEvent('catalog-change', { bubbles: true, detail: { entries: this.entries } })); }
    async copy() { const output = serializeCatalog(this.entries); try { await navigator.clipboard.writeText(output); } catch (error) { const area = document.createElement('textarea'); area.value = output; area.style.cssText = 'position:fixed;opacity:0'; document.body.appendChild(area); area.select(); const copied = document.execCommand('copy'); area.remove(); if (!copied) { window.prompt('この内容をすべてコピーしてください。', output); return; } } this.status.textContent = 'call-catalog.js の全文をコピーしました。'; }
  }

  customElements.define('call-catalog-list', CallCatalogList);
  customElements.define('call-catalog-editor', CallCatalogEditor);
})();
