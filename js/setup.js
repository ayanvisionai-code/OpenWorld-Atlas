// One entry per retail product. Replace its destination here when switching to affiliate links.
const product = (name, allowance, asin, url = 'https://www.amazon.com/dp/' + asin) => ({name, allowance, url});
const catalog = {
  ps: [
    product('PlayStation 5 Digital Edition · 825 GB', 599, 'B0FRGMYJMG'),
    product('PlayStation 5 · 1 TB disc model', 649, 'B0FRGTYSL5'),
    product('PlayStation 5 Pro · 2 TB', 899, 'B0FTMY4YZ2')
  ],
  xbox: [
    product('Xbox Series S · 512 GB', 400, 'B08G9J44ZN'),
    product('Xbox Series X Digital Edition · 1 TB', 600, 'B0DCD9LGHY'),
    product('Xbox Series X · 1 TB disc model', 650, 'B08H75RTZ8')
  ],
  pc: [
    product('CyberPowerPC GXiVR8060A47 · i5-14400F / RTX 5060 / 16 GB / 1 TB', 1200, 'B0DXVDC556'),
    product('Lenovo Legion Tower 5 · Ryzen 7 7800X3D / RTX 5070 / 32 GB / 1 TB', 2100, 'B0GNCFSYY7'),
    product('CyberPowerPC GXiVR8620A9 · Core Ultra 9 / RTX 5080 / 32 GB / 2 TB', 3500, 'B0DXVG8G7K')
  ],
  display: product('Acer SB220Q bi · 21.5-inch Full HD monitor', 100, 'B07CVL2D2S'),
  oled: product('Acer Predator X32 X3 · 31.5-inch 4K OLED monitor', 1000, 'B0D9PCJ3TR'),
  input: product('Logitech MK270 wireless keyboard and mouse', 30, 'B079JLY5M5'),
  headset: product('Razer BlackShark V2 X · 3.5 mm wired headset with mic', 50, 'B086PKMZ21'),
  mic: product('FIFINE K669B USB desk microphone', 40, 'B01MXL3EOU'),
  capture: product('Elgato HD60 X external capture card', 180, 'B09VDD6TTD'),
  desk: product('IAIB 55-inch L-shaped standing desk', 240, 'B0HFLSG499'),
  chair: product('Amazon Basics mesh mid-back office chair', 100, 'B00IIFW2L4')
};
const form = document.querySelector('#setup-form');
const currency = new Intl.NumberFormat('en-US', {style:'currency', currency:'USD', maximumFractionDigits:0});
const element = (tag, text) => Object.assign(document.createElement(tag), {textContent:text});

function configuration(tier = Number(form.elements.tier.value)) {
  const platform = form.elements.platform.value;
  const streaming = form.elements.purpose.value === 'stream';
  const pc = platform === 'pc';
  const choices = [
    ['system', pc ? 'Desktop with graphics card' : 'Console and controller', catalog[platform][tier], true],
    ['screen', 'Monitor', tier === 2 ? catalog.oled : catalog.display, tier > 0],
    ['headset', 'Headset with microphone', catalog.headset, tier > 0],
    ['desk', 'Desk', catalog.desk, tier === 2],
    ['chair', 'Chair', catalog.chair, tier === 2]
  ];
  if (pc) choices.push(['input','Keyboard and mouse',catalog.input,true]);
  if (streaming && !pc) choices.push(['capture','Capture card for a streaming computer',catalog.capture,tier === 2],
    ['host','Separate streaming desktop',catalog.pc[0],tier === 2]);
  if (streaming && pc) choices.push(['mic','USB microphone',catalog.mic,tier > 0]);
  return choices;
}
function presets() {
  for (const radio of form.querySelectorAll('[name=tier]')) {
    const presetCost = configuration(Number(radio.value))
      .reduce((sum, [,,item,selected]) => sum + (selected ? item.allowance : 0), 0);
    radio.parentElement.querySelector('output').textContent = currency.format(presetCost);
  }
  const options = document.querySelector('#options');
  options.replaceChildren();
  for (const [key,label,,included] of configuration()) {
    const control = document.createElement('input');
    Object.assign(control,{type:'checkbox',value:key,checked:included,name:'gear'});
    const wrapper = document.createElement('label');
    wrapper.append(control, ' ' + label);
    options.append(wrapper);
  }
}
function update() {
  const selected = new Set(new FormData(form).getAll('gear'));
  const list = document.querySelector('#parts');
  let total = 0;
  list.replaceChildren();
  for (const [key,category,item] of configuration()) {
    if (!selected.has(key)) continue;
    total += item.allowance;
    const row = document.createElement('li');
    const details = document.createElement('div');
    details.append(element('small',category),element('strong',item.name));
    const link = element('a','View on Amazon ↗');
    Object.assign(link,{href:item.url,rel:'noopener',target:'_blank'});
    row.append(details,element('b',currency.format(item.allowance)),link);
    list.append(row);
  }
  if (!selected.size) list.append(element('li','You have excluded all equipment. Select an item to add it back.'));
  document.querySelector('#total').textContent = currency.format(total) + ' estimated';
  const notes = ['Unchecked equipment is assumed to be available already.'];
  if (form.elements.platform.value !== 'pc') notes.push('A controller is included with the console. Use an existing HDMI TV or add a monitor.');
  if (form.elements.platform.value === 'pc') notes.push('General PC budget. Each tower includes its CPU and GPU. GTA VI PC requirements remain unverified.');
  if (form.elements.purpose.value === 'stream') notes.push(selected.has('capture') ? 'Connect console HDMI to the capture card, pass HDMI to the display, and connect USB to a compatible streaming computer.' : form.elements.platform.value === 'pc' ? 'Use streaming software on the gaming PC. A capture card is unnecessary for this single-PC setup.' : 'Use the console broadcast feature with a linked streaming account and an internet connection.');
  document.querySelector('#assumptions').textContent = notes.join(' ');
}
form.addEventListener('change', event => {
  if (event.target.name !== 'gear') presets();
  update();
});
presets();
update();
