// Everything the site does in the browser. It runs after `models.js`, with
// `color2k` and `models` in scope (see `getSiteScript` in `index.ts`).
//
// One color drives every page. Changing it repaints the site's own theme and
// every demo on screen, at most once a frame. Demos that are off screen wait
// until they scroll into view.
var c = color2k;
var root = document.documentElement;
var $ = function (selector, parent) {
  return (parent || document).querySelector(selector);
};
var $$ = function (selector, parent) {
  return Array.prototype.slice.call((parent || document).querySelectorAll(selector));
};
var reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
var darkMedia = matchMedia('(prefers-color-scheme: dark)');
var phone = matchMedia('(max-width: 899px)');

var store = {
  get: function (key) {
    try {
      return localStorage.getItem('color2k:' + key);
    } catch (error) {
      return null;
    }
  },
  set: function (key, value) {
    try {
      if (value === null) localStorage.removeItem('color2k:' + key);
      else localStorage.setItem('color2k:' + key, value);
    } catch (error) {
      // Nothing to do: the choice just will not survive a reload.
    }
  },
};

var stored = store.get('color');
var state = {
  color: stored && models.usable(stored) ? stored : models.DEFAULT,
  mode: store.get('mode') === 'light' || store.get('mode') === 'dark' ? store.get('mode') : 'system',
};
var isDark = function () {
  return state.mode === 'dark' || (state.mode === 'system' && darkMedia.matches);
};
var context = { bg: '#ffffff', dark: false };

function styleText(vars) {
  return Object.keys(vars)
    .map(function (name) {
      return name + ':' + vars[name];
    })
    .join(';');
}

// ------------------------------------------------------------------ toast

var toast = $('#toast');
var toastTimer;
function say(message) {
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('is-on');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(function () {
    toast.classList.remove('is-on');
  }, 1600);
}

function copy(value) {
  var done = function () {
    say('Copied ' + value);
  };
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(value).then(done, function () {
      say('Could not copy. Select the text instead.');
    });
  } else {
    say('Could not copy. Select the text instead.');
  }
}

// ------------------------------------------------------------------ demos

var demos = $$('[data-demo]').map(function (element) {
  var name = element.getAttribute('data-demo');
  var slots = {};
  $$('[data-t]', element).forEach(function (node) {
    var key = node.getAttribute('data-t');
    (slots[key] = slots[key] || []).push(node);
  });
  return {
    root: element,
    name: name,
    p: models.start(name, state.color),
    slots: slots,
    flags: $$('[data-flag]', element),
    rows: $$('[data-row]', element),
    inputs: $$('input[data-param]', element),
    chips: $$('.chip[data-param]', element),
    model: null,
    seen: false,
    stale: true,
  };
});
var demoOf = function (node) {
  var element = node.closest('[data-demo]');
  for (var index = 0; index < demos.length; index++) {
    if (demos[index].root === element) return demos[index];
  }
  return null;
};

function paintDemo(demo) {
  var model = models.demos[demo.name](state.color, demo.p, context);
  var before = demo.model || { vars: {}, text: {} };
  var name;
  for (name in model.vars) {
    if (before.vars[name] !== model.vars[name]) demo.root.style.setProperty(name, model.vars[name]);
  }
  for (name in model.text) {
    if (before.text[name] !== model.text[name] && demo.slots[name]) {
      for (var index = 0; index < demo.slots[name].length; index++) {
        demo.slots[name][index].textContent = model.text[name];
      }
    }
  }
  var flags = model.flags || {};
  demo.flags.forEach(function (node) {
    node.hidden = !flags[node.getAttribute('data-flag')];
  });
  demo.rows.forEach(function (node) {
    node.setAttribute('data-on', String(Boolean(flags[node.getAttribute('data-row')])));
  });
  demo.model = model;
  demo.stale = false;
}

// A demo's sliders and chips, set to match its settings.
function syncControls(demo) {
  demo.inputs.forEach(function (input) {
    var value = demo.p[input.getAttribute('data-param')];
    if (document.activeElement !== input || input.type === 'range') input.value = value;
  });
  demo.chips.forEach(function (chip) {
    chip.setAttribute(
      'aria-pressed',
      String(String(demo.p[chip.getAttribute('data-param')]) === chip.getAttribute('data-value'))
    );
  });
}

function setParam(demo, param, value) {
  demo.p[param] = value;
  syncControls(demo);
  paintDemo(demo);
}

if ('IntersectionObserver' in window) {
  var watcher = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        var demo = demoOf(entry.target);
        if (!demo) return;
        demo.seen = entry.isIntersecting;
        if (demo.seen && demo.stale) paintDemo(demo);
      });
    },
    { rootMargin: '200px' }
  );
  demos.forEach(function (demo) {
    watcher.observe(demo.root);
  });
} else {
  demos.forEach(function (demo) {
    demo.seen = true;
  });
}

// -------------------------------------------------------------- the color

var bar = $('#bar');
var pickText = $('#pick-text');
var pickError = $('#pick-error');
var hexSlots = $$('[data-site="hex"]');
var saveTimer;
var queued = false;
var source = '';
var SAMPLE_ROOT = ':root:root:root:root ';

// Kept for `theme.js`, which paints these before anything else loads.
function save() {
  clearTimeout(saveTimer);
  var custom = state.color !== models.DEFAULT;
  var vars = function (dark) {
    return styleText(models.tokenVars(models.site(state.color, dark))) + ';--pick:' + state.color;
  };
  store.set('color', custom ? state.color : null);
  store.set(
    'vars',
    custom
      ? JSON.stringify({
          light: vars(false),
          dark: vars(true),
          lightSamples: models.sampleCss(state.color, false, SAMPLE_ROOT),
          darkSamples: models.sampleCss(state.color, true, SAMPLE_ROOT),
        })
      : null
  );
}

/** The elements inside `element` that Tab stops on, in order. */
function tabStops(element) {
  return $$('a[href], button, input, [tabindex="0"]', element).filter(function (node) {
    return !node.disabled && node.getClientRects().length;
  });
}

/** Keeps Tab inside `stops` by wrapping at both ends. */
function wrapTab(event, stops) {
  if (event.key !== 'Tab' || !stops.length) return;
  var first = stops[0];
  var last = stops[stops.length - 1];
  var inside = stops.indexOf(document.activeElement) !== -1;
  if (event.shiftKey ? document.activeElement === first || !inside : document.activeElement === last || !inside) {
    event.preventDefault();
    (event.shiftKey ? last : first).focus();
  }
}

function paintSite() {
  var light = models.tokenVars(models.site(state.color, false));
  var dark = models.tokenVars(models.site(state.color, true));
  var active = isDark() ? dark : light;
  for (var name in active) root.style.setProperty(name, active[name]);
  root.style.setProperty('--pick', state.color);
  context = { bg: active['--bg'], dark: isDark() };

  // A drag changes the color every frame, so the save waits for it to settle.
  clearTimeout(saveTimer);
  saveTimer = setTimeout(save, 250);
}

function render() {
  queued = false;
  paintSite();
  if (pickText && document.activeElement !== pickText) pickText.value = state.color;
  hexSlots.forEach(function (node) {
    node.textContent = state.color;
  });
  if (source !== 'picker') readPicker();
  paintPicker();
  if (wheel) readWheel(source === 'wheel', source !== 'picker', source === 'light');
  demos.forEach(function (demo) {
    if (models.follows(demo.name) && source !== demo) {
      demo.p = models.start(demo.name, state.color);
      syncControls(demo);
    }
    if (demo.seen) paintDemo(demo);
    else demo.stale = true;
  });
  source = '';
}

function refresh() {
  if (!queued) {
    queued = true;
    requestAnimationFrame(render);
  }
}

/** Makes `color` the visitor's color. Returns false if color2k cannot read it. */
function setColor(color, from) {
  if (!models.usable(color)) return false;
  state.color = color;
  source = from || '';
  // A preset or a typed color is saved at once, so a link followed straight
  // after it carries the color to the next page.
  if (from !== 'wheel' && from !== 'picker' && from !== 'light') save();
  if (pickError) pickError.textContent = '';
  if (pickText) pickText.removeAttribute('aria-invalid');
  refresh();
  return true;
}

if (pickText) {
  pickText.addEventListener('input', function () {
    var value = pickText.value.trim();
    if (!value || setColor(value)) return;
    pickText.setAttribute('aria-invalid', 'true');
    pickError.textContent =
      'color2k cannot read "' + value + '". Try #ff2d6f, rgb(255, 45, 111) or tomato.';
  });
  pickText.addEventListener('blur', function () {
    pickText.value = state.color;
    pickText.removeAttribute('aria-invalid');
    pickError.textContent = '';
  });
}

// ----------------------------------------------------------------- picker

var picker = $('#picker');
var pickOpen = $('#pick-open');
var sv = $('#pick-sv');
var hueInput = $('#pick-hue');
var alphaInput = $('#pick-alpha');
var hsv = { h: 0, s: 0, v: 0, a: 1 };

function rgbToHsv(red, green, blue) {
  var max = Math.max(red, green, blue);
  var min = Math.min(red, green, blue);
  var delta = max - min;
  var hue = hsv.h;
  if (delta) {
    if (max === red) hue = ((green - blue) / delta) % 6;
    else if (max === green) hue = (blue - red) / delta + 2;
    else hue = (red - green) / delta + 4;
    hue = (hue * 60 + 360) % 360;
  }
  return { h: hue, s: max ? delta / max : 0, v: max / 255 };
}

function hsvToColor(value) {
  var chroma = value.v * value.s;
  var sector = value.h / 60;
  var second = chroma * (1 - Math.abs((sector % 2) - 1));
  var rgb =
    sector < 1 ? [chroma, second, 0]
    : sector < 2 ? [second, chroma, 0]
    : sector < 3 ? [0, chroma, second]
    : sector < 4 ? [0, second, chroma]
    : sector < 5 ? [second, 0, chroma]
    : [chroma, 0, second];
  var base = value.v - chroma;
  var out = c.rgba((rgb[0] + base) * 255, (rgb[1] + base) * 255, (rgb[2] + base) * 255, value.a);
  return value.a >= 1 ? c.toHex(out) : out;
}

// The picker's position, read back from the color.
function readPicker() {
  var rgba = c.parseToRgba(state.color);
  var next = rgbToHsv(rgba[0], rgba[1], rgba[2]);
  // Black and gray have no hue or saturation of their own. Keep the old ones,
  // so the square does not jump while you drag along its edges.
  hsv = { h: next.h, s: next.v ? next.s : hsv.s, v: next.v, a: rgba[3] };
}

function paintPicker() {
  if (!picker || picker.hidden) return;
  var solid = c.hsla(hsv.h, 1, 0.5, 1);
  var thumb = sv.firstElementChild;
  sv.style.setProperty('--hue', solid);
  thumb.style.left = hsv.s * 100 + '%';
  thumb.style.top = (1 - hsv.v) * 100 + '%';
  sv.setAttribute('aria-valuenow', Math.round(hsv.s * 100));
  sv.setAttribute(
    'aria-valuetext',
    'Saturation ' + Math.round(hsv.s * 100) + '%, brightness ' + Math.round(hsv.v * 100) + '%'
  );
  hueInput.value = Math.round(hsv.h);
  alphaInput.value = hsv.a;
  $('#pick-hue-value').textContent = Math.round(hsv.h) + '°';
  $('#pick-alpha-value').textContent = models.fmt(hsv.a);
  var opaque = c.toHex(state.color).slice(0, 7);
  picker.style.setProperty('--alpha-fill', 'linear-gradient(90deg,' + c.transparentize(opaque, 1) + ',' + opaque + ')');
}

function fromPicker() {
  setColor(hsvToColor(hsv), 'picker');
}

// Docked at the bottom of the first screen, the bar opens upward. Once it
// has scrolled to the top, there is only room below it.
function placePicker() {
  bar.classList.toggle('opens-up', bar.getBoundingClientRect().top > window.innerHeight / 2);
}

function togglePicker(open) {
  if (!picker) return;
  picker.hidden = !open;
  pickOpen.setAttribute('aria-expanded', String(open));
  if (open) {
    placePicker();
    readPicker();
    paintPicker();
    sv.focus();
  }
}

if (picker) {
  pickOpen.addEventListener('click', function () {
    togglePicker(picker.hidden);
  });

  var dragSv = function (event) {
    var box = sv.getBoundingClientRect();
    hsv.s = c.guard(0, 1, (event.clientX - box.left) / box.width);
    hsv.v = c.guard(0, 1, 1 - (event.clientY - box.top) / box.height);
    fromPicker();
  };
  sv.addEventListener('pointerdown', function (event) {
    sv.setPointerCapture(event.pointerId);
    dragSv(event);
    event.preventDefault();
    sv.focus();
  });
  sv.addEventListener('pointermove', function (event) {
    if (sv.hasPointerCapture(event.pointerId)) dragSv(event);
  });
  sv.addEventListener('keydown', function (event) {
    var step = event.shiftKey ? 0.1 : 0.02;
    var moves = {
      ArrowLeft: [-step, 0],
      ArrowRight: [step, 0],
      ArrowUp: [0, step],
      ArrowDown: [0, -step],
    };
    var move = moves[event.key];
    if (!move) return;
    event.preventDefault();
    hsv.s = c.guard(0, 1, hsv.s + move[0]);
    hsv.v = c.guard(0, 1, hsv.v + move[1]);
    fromPicker();
  });
  hueInput.addEventListener('input', function () {
    hsv.h = Number(hueInput.value);
    fromPicker();
  });
  alphaInput.addEventListener('input', function () {
    hsv.a = Number(alphaInput.value);
    fromPicker();
  });
  document.addEventListener('pointerdown', function (event) {
    if (!picker.hidden && !bar.contains(event.target)) togglePicker(false);
  });
  window.addEventListener(
    'scroll',
    function () {
      if (!picker.hidden) placePicker();
    },
    { passive: true }
  );
  // While the picker is open, Tab stays in the color bar: the swatch that
  // opened it, the text field, the presets and the picker itself.
  bar.addEventListener('keydown', function (event) {
    if (!picker.hidden) wrapTab(event, tabStops(bar));
  });
}

// ------------------------------------------------------------------ wheel

var wheel = $('#wheel');
var spin = $('#wheel-spin');
var turning = { h: 0, s: -1, l: -1, a: -1, turn: 0, vars: {}, speed: 0, frame: 0 };

function wheelColor() {
  var color = c.hsla(turning.h, turning.s, turning.l, turning.a);
  return turning.a >= 1 ? c.toHex(color) : c.toRgba(color);
}

function turnTo(hue, eased) {
  // Go the short way round.
  var target = -hue;
  var delta = ((((target - turning.turn) % 360) + 540) % 360) - 180;
  turning.turn += delta;
  turning.h = ((hue % 360) + 360) % 360;
  spin.classList.toggle('is-eased', Boolean(eased) && !reducedMotion.matches);
  spin.style.transform = 'rotate(' + turning.turn.toFixed(2) + 'deg)';
  wheel.setAttribute('aria-valuenow', Math.round(turning.h) % 360);
  wheel.setAttribute('aria-valuetext', state.color);
}

// The wheel's fills, read back from the color. While the wheel itself is
// turning (`own`), only the hue changes, so there is nothing to repaint.
function readWheel(own, eased, light) {
  if (own) {
    wheel.setAttribute('aria-valuetext', state.color);
    paintLight();
    return;
  }
  if (light) {
    // The lightness slider keeps the wheel's hue and saturation, which a
    // color cannot carry through black or white.
    turning.vars = models.wheel(turning.s, turning.l, turning.a);
    for (var key in turning.vars) wheel.style.setProperty(key, turning.vars[key]);
    wheel.setAttribute('aria-valuetext', state.color);
    paintLight();
    return;
  }
  var hsla = c.parseToHsla(state.color);
  var fresh = turning.s < 0;
  // White and black carry no saturation. Keep the wheel's own, so sliding
  // the lightness back brings the color back with it.
  if (!fresh && (hsla[2] <= 0.001 || hsla[2] >= 0.999)) hsla[1] = turning.s;
  if (hsla[1] !== turning.s || hsla[2] !== turning.l || hsla[3] !== turning.a) {
    turning.s = hsla[1];
    turning.l = hsla[2];
    turning.a = hsla[3];
    turning.vars = models.wheel(hsla[1], hsla[2], hsla[3]);
    for (var name in turning.vars) wheel.style.setProperty(name, turning.vars[name]);
  }
  // Gray has no hue. Leave the wheel where it is.
  if (fresh) turning.turn = -hsla[0];
  if ((hsla[1] > 0 && hsla[2] > 0.001 && hsla[2] < 0.999) || fresh) turnTo(hsla[0], eased && !fresh);
  paintLight();
}

var lightInput = $('#hero-light');
function paintLight() {
  if (!lightInput) return;
  var percent = Math.round(turning.l * 100);
  if (document.activeElement !== lightInput) lightInput.value = percent;
  $('#hero-light-value').textContent = percent + '%';
  $('#hero-light-fill').style.setProperty('--track', models.lightnessTrack(turning.h, turning.s));
}
if (lightInput) {
  lightInput.addEventListener('input', function () {
    turning.l = Number(lightInput.value) / 100;
    setColor(wheelColor(), 'light');
  });
}

if (wheel) {
  var grab = null;
  var angleOf = function (event) {
    var box = wheel.getBoundingClientRect();
    return (
      (Math.atan2(event.clientY - (box.top + box.height / 2), event.clientX - (box.left + box.width / 2)) * 180) /
      Math.PI
    );
  };
  var coast = function (last) {
    turning.frame = requestAnimationFrame(function (now) {
      var elapsed = Math.min(now - last, 40);
      turning.speed *= Math.pow(0.94, elapsed / 16);
      if (Math.abs(turning.speed) < 0.01) return;
      turnTo(turning.h - turning.speed * elapsed);
      setColor(wheelColor(), 'wheel');
      coast(now);
    });
  };

  wheel.addEventListener('pointerdown', function (event) {
    cancelAnimationFrame(turning.frame);
    wheel.setPointerCapture(event.pointerId);
    grab = { angle: angleOf(event), time: event.timeStamp, moved: 0, target: event.target };
    turning.speed = 0;
  });
  wheel.addEventListener('pointermove', function (event) {
    if (!grab || !wheel.hasPointerCapture(event.pointerId)) return;
    var angle = angleOf(event);
    var delta = ((((angle - grab.angle) % 360) + 540) % 360) - 180;
    var elapsed = Math.max(event.timeStamp - grab.time, 1);
    grab.moved += Math.abs(delta);
    if (grab.moved < 1.5) return;
    wheel.classList.add('is-held');
    turning.speed = 0.6 * turning.speed + 0.4 * (delta / elapsed);
    grab.angle = angle;
    grab.time = event.timeStamp;
    turnTo(turning.h - delta);
    setColor(wheelColor(), 'wheel');
  });
  var release = function (event) {
    if (!grab) return;
    wheel.classList.remove('is-held');
    if (grab.moved < 1.5 && event.type === 'pointerup') {
      // A tap on a wedge makes that wedge your color.
      var key = grab.target.getAttribute && grab.target.getAttribute('data-w');
      var tapped = key && turning.vars['--w' + key];
      if (tapped) setColor(turning.a >= 1 ? c.toHex(tapped) : c.toRgba(tapped));
    } else if (event.type === 'pointerup' && !reducedMotion.matches && event.timeStamp - grab.time < 80 && Math.abs(turning.speed) > 0.05) {
      coast(performance.now());
    }
    grab = null;
  };
  wheel.addEventListener('pointerup', release);
  wheel.addEventListener('pointercancel', release);
  wheel.addEventListener('keydown', function (event) {
    var step = event.shiftKey ? 15 : 5;
    var move = { ArrowLeft: -step, ArrowDown: -step, ArrowRight: step, ArrowUp: step }[event.key];
    if (!move) return;
    event.preventDefault();
    cancelAnimationFrame(turning.frame);
    turnTo(turning.h + move, true);
    setColor(wheelColor(), 'wheel');
  });
}

// --------------------------------------------------------------- controls

document.addEventListener('input', function (event) {
  var input = event.target;
  var param = input.getAttribute && input.getAttribute('data-param');
  var demo = param && demoOf(input);
  if (!demo) return;
  setParam(demo, param, input.type === 'range' ? Number(input.value) : input.value);
});

document.addEventListener('click', function (event) {
  var target = event.target.closest('button, a, [data-steps]');
  if (!target) return;
  var demo = demoOf(target);
  var value;
  if (demo && !demo.model) paintDemo(demo);

  if (target.hasAttribute('data-pick')) {
    setColor(target.getAttribute('data-pick'));
  } else if (target.hasAttribute('data-say')) {
    say(target.getAttribute('data-say'));
  } else if (target.hasAttribute('data-copy-text')) {
    copy(target.getAttribute('data-copy-text'));
  } else if (target.hasAttribute('data-tile')) {
    $('#map-readout').textContent = target.getAttribute('data-tile');
  } else if (!demo || !demo.model) {
    return;
  } else if (target.classList.contains('chip')) {
    value = target.getAttribute('data-value');
    setParam(demo, target.getAttribute('data-param'), /^-?[\d.]+$/.test(value) ? Number(value) : value);
  } else if (target.hasAttribute('data-use')) {
    setColor(demo.model.use, demo);
  } else if (target.hasAttribute('data-k')) {
    copy(demo.model.vars['--' + target.getAttribute('data-k')]);
  } else if (target.hasAttribute('data-copy')) {
    copy(demo.model.text[target.getAttribute('data-copy')].replace(/^'|'$/g, ''));
  } else if (target.hasAttribute('data-steps')) {
    var box = target.getBoundingClientRect();
    var steps = demo.model.steps;
    copy(steps[Math.min(steps.length - 1, Math.floor(((event.clientX - box.left) / box.width) * steps.length))]);
  }
});

// The ring in the adjustHue demo: drag the hand round it.
$$('[data-ring]').forEach(function (ring) {
  var demo = demoOf(ring);
  var drag = function (event) {
    var box = ring.getBoundingClientRect();
    var degrees =
      (Math.atan2(event.clientX - (box.left + box.width / 2), -(event.clientY - (box.top + box.height / 2))) * 180) /
      Math.PI;
    setParam(demo, 'degrees', Math.round((degrees + 360) % 360));
  };
  ring.addEventListener('pointerdown', function (event) {
    ring.setPointerCapture(event.pointerId);
    drag(event);
    event.preventDefault();
  });
  ring.addEventListener('pointermove', function (event) {
    if (ring.hasPointerCapture(event.pointerId)) drag(event);
  });
});

// The treemap reads a tile out when you point at it or tab to it.
['pointerover', 'focusin'].forEach(function (type) {
  document.addEventListener(type, function (event) {
    var tile = event.target.closest && event.target.closest('[data-tile]');
    if (tile) $('#map-readout').textContent = tile.getAttribute('data-tile');
  });
});

// Every code block gets a Copy button.
$$('.prose pre.shiki').forEach(function (pre) {
  var wrap = document.createElement('div');
  var button = document.createElement('button');
  wrap.className = 'code';
  button.type = 'button';
  button.className = 'code-copy';
  button.textContent = 'Copy';
  button.addEventListener('click', function () {
    copy(pre.textContent.trim());
  });
  pre.parentNode.insertBefore(wrap, pre);
  wrap.appendChild(pre);
  wrap.appendChild(button);
});

// ------------------------------------------------------------------- mode

// One quiet button by the logo. Each press moves to the next mode.
var modeButton = $('#mode');
var MODES = ['system', 'light', 'dark'];
var MODE_NAMES = { system: 'System', light: 'Light', dark: 'Dark' };
function paintMode() {
  if (state.mode === 'system') root.removeAttribute('data-theme');
  else root.setAttribute('data-theme', state.mode);
  if (!modeButton) return;
  var next = MODES[(MODES.indexOf(state.mode) + 1) % MODES.length];
  modeButton.setAttribute('data-current', state.mode);
  modeButton.title = 'Color mode: ' + MODE_NAMES[state.mode];
  modeButton.setAttribute(
    'aria-label',
    'Color mode: ' + MODE_NAMES[state.mode] + '. Switch to ' + MODE_NAMES[next] + '.'
  );
}
if (modeButton) {
  modeButton.addEventListener('click', function () {
    state.mode = MODES[(MODES.indexOf(state.mode) + 1) % MODES.length];
    store.set('mode', state.mode === 'system' ? null : state.mode);
    paintMode();
    say('Color mode: ' + MODE_NAMES[state.mode]);
    refresh();
  });
}
darkMedia.addEventListener('change', refresh);

// ------------------------------------------------------------------- menu

var menu = $('#menu');
var menuOpen = $('[data-menu-open]');
var behind = $$('.main, .top, .skip');
function toggleMenu(open) {
  root.classList.toggle('menu-open', open);
  // Everything but the sheet is out of reach while it is open.
  behind.forEach(function (element) {
    element.inert = open;
  });
  menuOpen.setAttribute('aria-expanded', String(open));
  if (open) $('[data-menu-close]').focus();
  else menuOpen.focus();
}
if (menu && menuOpen) {
  menuOpen.setAttribute('role', 'button');
  menuOpen.setAttribute('aria-expanded', 'false');
  menuOpen.addEventListener('click', function (event) {
    // On a wide screen the menu is always there, and the link is hidden.
    if (!phone.matches) return;
    event.preventDefault();
    toggleMenu(true);
  });
  menuOpen.addEventListener('keydown', function (event) {
    if (event.key === ' ') {
      event.preventDefault();
      menuOpen.click();
    }
  });
  menu.addEventListener('keydown', function (event) {
    if (root.classList.contains('menu-open')) wrapTab(event, tabStops(menu));
  });
  menu.addEventListener('click', function (event) {
    if (!root.classList.contains('menu-open')) return;
    if (event.target.closest('[data-menu-close], a')) toggleMenu(false);
  });
  phone.addEventListener('change', function () {
    if (root.classList.contains('menu-open')) toggleMenu(false);
  });
}

document.addEventListener('keydown', function (event) {
  if (event.key !== 'Escape') return;
  if (root.classList.contains('menu-open')) toggleMenu(false);
  else if (picker && !picker.hidden) {
    togglePicker(false);
    pickOpen.focus();
  }
});

// ------------------------------------------------------------------ start

// The menu marks the section you are reading.
var spies = $$('[data-spy]');
if ('IntersectionObserver' in window && spies.length) {
  var inView = {};
  var spyWatcher = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        inView[entry.target.id] = entry.isIntersecting;
      });
      // The last section that reaches the reading line is the current one.
      var current = '';
      spies.forEach(function (link) {
        if (inView[link.getAttribute('data-spy')]) current = link.getAttribute('data-spy');
      });
      spies.forEach(function (link) {
        if (link.getAttribute('data-spy') === current) link.setAttribute('aria-current', 'true');
        else link.removeAttribute('aria-current');
      });
    },
    { rootMargin: '-30% 0px -60% 0px' }
  );
  spies.forEach(function (link) {
    var section = document.getElementById(link.getAttribute('data-spy'));
    if (section) spyWatcher.observe(section);
  });
}

window.addEventListener('pagehide', function () {
  if (saveTimer) save();
});

paintMode();
render();
