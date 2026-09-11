// 各候補は自由入力、または共通コール一覧への参照。
var variantInputs = [];

function callText(value) {
  return Array.isArray(value) ? value.join('\n') : String(value || '');
}

function catalogEntry(id) {
  return (window.CALL_CATALOG || []).find(function(entry) { return entry.id === id; });
}

function addVariantInput(value) {
  value = value || {};
  var first = variantInputs.length === 0;
  var wrapper = document.createElement('div');
  wrapper.className = 'form-group';
  wrapper.style.cssText = 'padding: 10px; border: 1px solid #ddd; border-radius: 6px; margin-bottom: 8px;';
  var label = document.createElement('label');
  label.textContent = first ? 'コール候補 1' : '別のコール候補';
  var search = document.createElement('input');
  search.type = 'text';
  search.placeholder = 'まとめのコール名・内容で検索';
  search.setAttribute('aria-label', 'まとめのコールを検索');
  var select = document.createElement('select');
  select.setAttribute('aria-label', 'まとめからコールを選択');
  select.style.cssText = 'width:100%; padding:8px; font:inherit;';
  var textarea = first ? document.getElementById('call-input') : document.createElement('textarea');
  textarea.setAttribute('aria-label', first ? 'コール候補 1 の内容' : '別のコール候補の内容');
  var state = { wrapper: wrapper, textarea: textarea, mixId: value.mixId || '', name: value.name || '' };
  function populate() {
    select.replaceChildren(new Option('自由入力', ''));
    var query = search.value.trim().toLocaleLowerCase();
    (window.CALL_CATALOG || []).forEach(function(entry) {
      if (entry.id === state.mixId || (entry.name + '\n' + entry.call).toLocaleLowerCase().includes(query)) {
        select.add(new Option(entry.name, entry.id));
      }
    });
    select.value = state.mixId;
  }
  function resolve() {
    var entry = catalogEntry(state.mixId);
    textarea.readOnly = !!entry;
    if (entry) textarea.value = entry.call;
  }
  textarea.value = callText(value.call);
  populate();
  resolve();
  search.addEventListener('input', populate);
  select.addEventListener('change', function() {
    state.mixId = select.value;
    state.name = '';
    resolve();
  });
  var detach = document.createElement('button');
  detach.type = 'button';
  detach.className = 'btn btn-outline btn-sm';
  detach.textContent = '自由入力にする';
  detach.addEventListener('click', function() {
    state.mixId = '';
    populate();
    resolve();
    textarea.focus();
  });
  wrapper.append(label, search, select, textarea, detach);
  if (!first) {
    var remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'btn btn-outline btn-sm';
    remove.textContent = 'この候補を削除';
    remove.addEventListener('click', function() {
      variantInputs.splice(variantInputs.indexOf(state), 1);
      wrapper.remove();
    });
    wrapper.appendChild(remove);
  }
  variantInputs.push(state);
  document.getElementById('variant-editor').appendChild(wrapper);
}

function readVariantInputs() {
  return variantInputs.map(function(state) {
    var value = { call: state.textarea.value.trim() };
    if (state.mixId) value.mixId = state.mixId;
    if (state.name) value.name = state.name;
    return value;
  });
}

function resetVariantInputs(values) {
  // 先頭の入力欄は既存のフォームAPIでも利用するため同じ要素を再利用する。
  var textarea = document.getElementById('call-input');
  document.body.appendChild(textarea);
  document.getElementById('variant-editor').replaceChildren();
  variantInputs = [];
  (values && values.length ? values : [{}]).forEach(addVariantInput);
}

function loadVariantInputs(item) {
  resetVariantInputs(item.variants && item.variants.length ? item.variants : [item]);
}

function describeVariants(item) {
  return (item.variants && item.variants.length ? item.variants : [item]).map(function(variant, index) {
    var entry = catalogEntry(variant.mixId);
    return (item.variants ? '【候補 ' + (index + 1) + '】' : '') +
      (entry ? entry.name + '：' + entry.call : callText(variant.call));
  }).join('\n');
}

document.getElementById('call-input').parentElement.querySelector('label').remove();
var initialMix = catalogEntry(new URLSearchParams(location.search).get('mix'));
resetVariantInputs(initialMix ? [{ mixId: initialMix.id }] : undefined);
