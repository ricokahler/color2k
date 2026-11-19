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
  color: stored && models.tryParse(stored) ? stored : models.DEFAULT,
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

function paintSite() {
  var light = models.tokenVars(models.site(state.color, false));
  var dark = models.tokenVars(models.site(state.color, true));
  var active = isDark() ? dark : light;
  for (var name in active) root.style.setProperty(name, active[name]);
  root.style.setProperty('--pick', state.color);
  context = { bg: active['--bg'], dark: isDark() };

  // Kept for `theme.js`, which paints these before anything else loads.
  clearTimeout(saveTimer);
  saveTimer = setTimeout(function () {
    var custom = state.color !== models.DEFAULT;
    store.set('color', custom ? state.color : null);
    store.set(
      'vars',
      custom
        ? JSON.stringify({
            light: styleText(light) + ';--pick:' + state.color,
            dark: styleText(dark) + ';--pick:' + state.color,
          })
        : null
    );
  }, 250);
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
  if (wheel) readWheel(source === 'wheel', source !== 'picker');
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
  if (!models.tryParse(color)) return false;
  state.color = color;
  source = from || '';
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

function togglePicker(open) {
  if (!picker) return;
  picker.hidden = !open;
  pickOpen.setAttribute('aria-expanded', String(open));
  if (open) {
    // Docked at the bottom of the first screen, the bar opens upward.
    var box = bar.getBoundingClientRect();
    bar.classList.toggle('opens-up', box.top > window.innerHeight / 2);
    readPicker();
    paintPicker();
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
    hsv.h = Number(hueInput.value) % 360;
    fromPicker();
  });
  alphaInput.addEventListener('input', function () {
    hsv.a = Number(alphaInput.value);
    fromPicker();
  });
  document.addEventListener('pointerdown', function (event) {
    if (!picker.hidden && !bar.contains(event.target)) togglePicker(false);
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
function readWheel(own, eased) {
  if (own) {
    wheel.setAttribute('aria-valuetext', state.color);
    return;
  }
  var hsla = c.parseToHsla(state.color);
  var fresh = turning.s < 0;
  if (hsla[1] !== turning.s || hsla[2] !== turning.l || hsla[3] !== turning.a) {
    turning.s = hsla[1];
    turning.l = hsla[2];
    turning.a = hsla[3];
    turning.vars = models.wheel(hsla[1], hsla[2], hsla[3]);
    for (var name in turning.vars) wheel.style.setProperty(name, turning.vars[name]);
  }
  // Gray has no hue. Leave the wheel where it is.
  if (fresh) turning.turn = -hsla[0];
  if (hsla[1] > 0 || fresh) turnTo(hsla[0], eased && !fresh);
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

var modeButtons = $$('[data-mode]');
function paintMode() {
  if (state.mode === 'system') root.removeAttribute('data-theme');
  else root.setAttribute('data-theme', state.mode);
  modeButtons.forEach(function (button) {
    button.setAttribute('aria-pressed', String(button.getAttribute('data-mode') === state.mode));
  });
}
modeButtons.forEach(function (button) {
  button.addEventListener('click', function () {
    state.mode = button.getAttribute('data-mode');
    store.set('mode', state.mode === 'system' ? null : state.mode);
    paintMode();
    refresh();
  });
});
darkMedia.addEventListener('change', refresh);

// ------------------------------------------------------------------- menu

var menu = $('#menu');
var menuOpen = $('[data-menu-open]');
var page = $('.main');
function toggleMenu(open) {
  root.classList.toggle('menu-open', open);
  page.inert = open;
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

// The site used to be one page. A link to an old anchor goes to its new home.
var moved = document.body.getAttribute('data-moved');
var hash = location.hash.slice(1);
if (moved && hash && !document.getElementById(hash)) {
  var target = JSON.parse(moved)[hash];
  if (target) location.replace(target);
}

paintMode();
render();
