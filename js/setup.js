(() => {
  const form = document.querySelector('#setup-form');
  const receipt = document.querySelector('#receipt');
  const options = document.querySelector('#options');
  const fields = form.elements;
  const currency = new Intl.NumberFormat('en-US', {style: 'currency', currency: 'USD', maximumFractionDigits: 0});
  const tierNames = ['Value', 'Mid-range', 'Premium'];
  const selected = new Map();
  const parts = ['cpu', 'gpu', 'board', 'ram', 'ssd', 'psu', 'cooler', 'case'];
  const make = (tag, text) => Object.assign(document.createElement(tag), {textContent: text});
  const choices = () => {
    const platform = fields.platform.value;
    const pc = platform === 'pc';
    const keys = [];
    if (pc) {
      if (fields.build.value === 'parts') keys.push(...parts);
      if (fields.build.value === 'prebuilt') keys.push('pc');
      keys.push('keyboard', 'mouse');
    } else if (!fields.owned.checked) {
      keys.push(platform);
    }
    keys.push('display', 'headset', 'desk', 'chair');
    if (fields.purpose.value === 'stream') {
      keys.push('light');
      if (pc || fields.broadcast.value === 'capture') {
        keys.push('mic', 'camera');
        if (!pc) keys.push('capture');
      } else {
        keys.push(platform === 'ps' ? 'psCamera' : 'camera');
      }
    }
    return keys;
  };

  function renderOptions() {
    const pc = fields.platform.value === 'pc';
    document.querySelector('#pc-mode').hidden = !pc;
    document.querySelector('#ownership').hidden = pc;
    document.querySelector('#stream-mode').hidden = pc || fields.purpose.value !== 'stream';
    const tier = Number(fields.tier.value);
    options.replaceChildren();
    for (const key of choices()) {
      const {label, models} = gear[key];
      const state = selected.get(key) || {};
      const row = make('div', '');
      row.className = 'gear-row';
      const toggle = make('input', '');
      const requiredByDefault = parts.includes(key) || ['ps','xbox','pc','mouse','keyboard','capture'].includes(key);
      Object.assign(toggle, {type: 'checkbox', name: 'include', value: key, checked: state.included ?? (requiredByDefault || tier > 0 && ['headset','display'].includes(key))});
      const heading = make('label', '');
      heading.append(toggle, label);
      const select = make('select', '');
      select.dataset.key = key;
      select.setAttribute('aria-label', label + ' model');
      models.forEach((model, index) => select.add(new Option((models.length > 1 ? tierNames[index] + ' · ' : '') + model.name + ' · ' + currency.format(model.allowance), index)));
      select.selectedIndex = Math.min(state.model ?? tier, models.length - 1);
      select.disabled = !toggle.checked;
      row.append(heading, select);
      options.append(row);
    }
  }
  function notes() {
    const pc = fields.platform.value === 'pc';
    const streaming = fields.purpose.value === 'stream';
    const lines = ['Unchecked items are excluded from your budget.'];
    if (pc && fields.build.value === 'parts') lines.push('These builds pair AM5 processors with DDR5. Before checkout, confirm BIOS support, cooler height, memory clearance and the selected GPU’s power connectors. A boxed Ryzen 5 7600 includes a cooler you can reuse.');
    if (pc) lines.push('This is a general gaming PC budget. GTA VI PC performance is unverified.');
    else lines.push('A new console includes a controller. You can reuse an HDMI TV or monitor.');
    if (streaming && pc) lines.push('For single-PC streaming, capture the game in broadcasting software.');
    if (streaming && !pc && fields.broadcast.value === 'capture') lines.push('External capture uses your separate compatible computer. Connect USB microphones and cameras to that computer.');
    if (streaming && !pc && fields.broadcast.value === 'native') lines.push(fields.platform.value === 'ps' ? 'Broadcast from the PS5 using the controller or headset microphone. For face video, this list uses Sony’s supported HD Camera.' : 'For native Xbox broadcasting, use a compatible USB webcam in a supported mode and a controller-connected headset microphone.');
    return lines.join(' ');
  }
  function refresh() {
    renderOptions();
    document.querySelector('#planner-note').textContent = notes();
  }
  form.addEventListener('change', event => {
    receipt.hidden = true;
    const control = event.target;
    const key = control.dataset.key || (control.name === 'include' && control.value);
    if (key) {
      const state = selected.get(key) || {};
      if (control.name === 'include') {
        state.included = control.checked;
        control.closest('.gear-row').querySelector('select').disabled = !control.checked;
      } else {
        state.model = Number(control.value);
      }
      selected.set(key, state);
      return;
    }
    if (control.name === 'tier') selected.forEach(state => { delete state.model; });
    refresh();
  });
  form.addEventListener('submit', event => {
    event.preventDefault();
    const list = document.querySelector('#parts');
    list.replaceChildren();
    let total = 0;
    for (const toggle of options.querySelectorAll('input:checked')) {
      const group = gear[toggle.value];
      const item = group.models[toggle.closest('.gear-row').querySelector('select').selectedIndex];
      const line = make('li', '');
      const description = make('div', '');
      description.append(make('small', group.label), make('strong', item.name));
      const shop = make('a', 'View product on Amazon ↗');
      Object.assign(shop, {href: item.url, target: '_blank', rel: 'noopener'});
      line.append(description, make('b', currency.format(item.allowance)), shop);
      list.append(line);
      total += item.allowance;
    }
    if (!list.children.length) list.append(make('li', 'You have selected no purchases.'));
    document.querySelector('#total').textContent = currency.format(total) + ' estimated';
    document.querySelector('#assumptions').textContent = fields.platform.selectedOptions[0].text + ' · ' + tierNames[Number(fields.tier.value)] + ' · USD before tax';
    receipt.hidden = false;
    receipt.focus({preventScroll: true});
    receipt.scrollIntoView({behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start'});
  });
  refresh();
})();
