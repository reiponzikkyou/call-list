const STORAGE_KEY = "x-embed-test-urls";
const MAX_POSTS = 6;

const fields = document.querySelector("#url-fields");
const grid = document.querySelector("#post-grid");
const previewButton = document.querySelector("#preview-button");
const clearButton = document.querySelector("#clear-button");
const themeSelect = document.querySelector("#theme-select");
const message = document.querySelector("#message");
const postCount = document.querySelector("#post-count");

function savedUrls() {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return Array.isArray(value) ? value.slice(0, MAX_POSTS) : [];
  } catch {
    return [];
  }
}

function makeFields() {
  const urls = savedUrls();
  for (let index = 0; index < MAX_POSTS; index += 1) {
    const row = document.createElement("label");
    row.className = "url-row";
    row.innerHTML = `
      <span class="url-number">${index + 1}</span>
      <input class="url-input" type="url" inputmode="url"
        aria-label="${index + 1}件目のポストURL"
        placeholder="https://x.com/account/status/1234567890"
        value="${escapeAttribute(urls[index] || "")}">
    `;
    fields.appendChild(row);
  }
}

function escapeAttribute(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function getPostId(url) {
  try {
    const parsed = new URL(url);
    if (!["x.com", "www.x.com", "twitter.com", "www.twitter.com"].includes(parsed.hostname)) return null;
    return parsed.pathname.match(/\/status\/(\d+)/)?.[1] || null;
  } catch {
    return null;
  }
}

function waitForWidgets() {
  return new Promise((resolve, reject) => {
    const started = Date.now();
    const check = () => {
      if (window.twttr?.widgets?.createTweet) return resolve();
      if (Date.now() - started > 10000) return reject(new Error("Xの埋め込み機能を読み込めませんでした。"));
      setTimeout(check, 100);
    };
    check();
  });
}

function fitPostToTile(slot, stage, iframe) {
  const BASE_WIDTH = 550;

  const resize = () => {
    const scale = Math.min(slot.clientWidth / BASE_WIDTH, 1);
    stage.style.transform = `scale(${scale})`;
    slot.style.height = `${Math.ceil(iframe.offsetHeight * scale)}px`;
  };

  const observer = new ResizeObserver(resize);
  observer.observe(slot);
  observer.observe(iframe);
  resize();
}

async function renderPosts() {
  const inputs = [...document.querySelectorAll(".url-input")];
  const urls = inputs.map((input) => input.value.trim());
  const entries = urls.map((url, index) => ({ url, index, id: url ? getPostId(url) : null }));
  const invalid = entries.filter((entry) => entry.url && !entry.id);

  inputs.forEach((input, index) => input.classList.toggle("invalid", invalid.some((entry) => entry.index === index)));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(urls));

  if (invalid.length) {
    message.textContent = `${invalid.map((entry) => entry.index + 1).join("、")}番のURLを確認してください。`;
    message.className = "message error";
    return;
  }

  const posts = entries.filter((entry) => entry.id);
  if (!posts.length) {
    grid.innerHTML = `<div class="empty-state"><span>URLを入力してください</span><p>入力後に「6件をプレビュー」を押してください。</p></div>`;
    postCount.textContent = `0 / ${MAX_POSTS}`;
    message.textContent = "";
    return;
  }

  previewButton.disabled = true;
  message.className = "message";
  message.textContent = "Xからカードを読み込んでいます…";
  grid.className = "post-grid columns-3";
  grid.replaceChildren();

  try {
    await waitForWidgets();
    let rendered = 0;
    for (const post of posts) {
      const slot = document.createElement("article");
      slot.className = "post-slot";
      const stage = document.createElement("div");
      stage.className = "post-scale-stage";
      slot.appendChild(stage);
      grid.appendChild(slot);

      const result = await window.twttr.widgets.createTweet(post.id, stage, {
        theme: themeSelect.value,
        conversation: "none",
        cards: "visible",
        align: "center",
        width: 550,
        dnt: true
      });

      if (result) {
        rendered += 1;
        fitPostToTile(slot, stage, result);
      } else {
        slot.innerHTML = `<div class="post-error">${post.index + 1}番のポストを表示できませんでした。削除済み・非公開の可能性があります。</div>`;
      }
    }
    postCount.textContent = `${rendered} / ${MAX_POSTS}`;
    message.textContent = `${rendered}件を表示しました。URLはこのブラウザに保存されます。`;
  } catch (error) {
    message.textContent = `${error.message} 通信環境や広告ブロッカーを確認してください。`;
    message.className = "message error";
  } finally {
    previewButton.disabled = false;
  }
}

previewButton.addEventListener("click", renderPosts);
themeSelect.addEventListener("change", () => {
  if (document.querySelector(".post-slot")) renderPosts();
});
clearButton.addEventListener("click", () => {
  document.querySelectorAll(".url-input").forEach((input) => {
    input.value = "";
    input.classList.remove("invalid");
  });
  localStorage.removeItem(STORAGE_KEY);
  renderPosts();
});

makeFields();
