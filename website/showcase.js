// The live demos on the home page: the hero palette and the function gallery.
//
// This one file runs in two places. The website build calls `heroHtml` and
// `galleryHtml` with the library to render the page's starting state, so it
// works without JavaScript. The page then inlines this file and calls `start`
// to animate the same markup. Keep it plain browser JavaScript, no imports.
var showcase = (function () {
  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function quote(value) {
    return "'" + value + "'";
  }

  // Shows a result the way the docs do: `'#fff'`, `[255, 0, 0, 1]`, `4.54`.
  function format(value) {
    if (typeof value === 'string') return quote(value);
    if (typeof value === 'number') return String(+value.toFixed(3));
    if (Array.isArray(value)) return '[' + value.map(format).join(', ') + ']';
    return String(value);
  }

  // ---------------------------------------------------------------- hero ---

  // One row of the hero palette per function, nine cells each.
  var ROWS = [
    ['getScale', function (c, x, i) { return c.getScale('#fff', x, '#000')((i + 1) / 10); }],
    ['lighten', function (c, x, i) { return c.lighten(x, (8 - i) * 0.045); }],
    ['darken', function (c, x, i) { return c.darken(x, i * 0.045); }],
    ['desaturate', function (c, x, i) { return c.desaturate(x, i * 0.1); }],
    ['adjustHue', function (c, x, i) { return c.adjustHue(x, i * 40); }],
    ['mix', function (c, x, i) { return c.mix(x, 'gold', i / 8); }],
    ['transparentize', function (c, x, i) { return c.transparentize(x, i / 9); }],
  ];

  // Everything the hero shows, `seconds` into its drift around the color wheel.
  function hero(c, seconds) {
    var base = c.toHex(
      c.hsla((232 + seconds * 14) % 360, 0.82, 0.56 + 0.2 * Math.sin(seconds * 0.45), 1)
    );
    var readable = c.readableColor(base);

    return {
      base: base,
      readable: readable,
      ratio: c.getContrast(base, readable).toFixed(2) + ':1',
      aa: !c.hasBadContrast(readable, 'aa', base),
      aaa: !c.hasBadContrast(readable, 'aaa', base),
      cells: ROWS.map(function (row) {
        var cells = [];
        for (var i = 0; i < 9; i++) cells.push(row[1](c, base, i));
        return cells;
      }),
    };
  }

  function heroHtml(c) {
    var state = hero(c, 0);

    return (
      '<div class="live" id="live">' +
      '<div class="live-banner" style="background:' + state.base + ';color:' + state.readable + '">' +
      '<div><strong>Always readable</strong>' +
      '<code>readableColor(<span data-live="base">' + quote(state.base) + '</span>) // ' +
      '<span data-live="readable">' + quote(state.readable) + '</span></code></div>' +
      '<p class="live-badges"><b data-live="ratio">' + state.ratio + '</b>' +
      '<span data-live="aa" data-pass="' + state.aa + '">AA</span>' +
      '<span data-live="aaa" data-pass="' + state.aaa + '">AAA</span></p>' +
      '</div>' +
      '<ul class="live-rows">' +
      ROWS.map(function (row, index) {
        return (
          '<li><code>' + row[0] + '</code><span class="live-cells">' +
          state.cells[index]
            .map(function (color) { return '<i style="background:' + color + '"></i>'; })
            .join('') +
          '</span></li>'
        );
      }).join('') +
      '</ul>' +
      '</div>'
    );
  }

  // ------------------------------------------------------------- gallery ---

  // Demos whose function has no amount to play with move the input color's
  // lightness instead.
  function shade(c, color, amount) {
    return c.toHex(c.lighten(color, amount));
  }

  // Contrast only means something between opaque colors, so the contrast
  // demos first flatten a see-through input onto the white they are drawn on.
  function opaque(c, color) {
    var rgb = c.parseToRgba(color);
    var over = function (channel) { return channel * rgb[3] + 255 * (1 - rgb[3]); };
    return c.rgba(over(rgb[0]), over(rgb[1]), over(rgb[2]), 1);
  }

  var LIGHTNESS = { label: 'Lightness of the input', min: -0.4, max: 0.4, step: 0.01, value: 0 };
  var SCALE_ENDS = ['gold', 'midnightblue'];
  var BAD_INPUTS = ['rgb(1 2 3)', '#12345', 'oklch(70% 0.1 200)', 'hsl(0, 200%, 50%)', 'not a color'];

  // Each demo: the stage it draws on, its slider, and a `view` that returns
  // the code line, the result and the values the stage needs.
  var DEMOS = {
    parseToRgba: {
      stage: 'bars', slider: LIGHTNESS,
      view: function (c, color, v) {
        var x = shade(c, color, v);
        var out = c.parseToRgba(x);
        return {
          code: 'parseToRgba(' + quote(x) + ')', out: format(out), a: x,
          bars: [out[0] / 255, out[1] / 255, out[2] / 255, out[3]], labels: ['R', 'G', 'B', 'A'],
        };
      },
    },
    parseToHsla: {
      stage: 'bars', slider: LIGHTNESS,
      view: function (c, color, v) {
        var x = shade(c, color, v);
        var out = c.parseToHsla(x);
        return {
          code: 'parseToHsla(' + quote(x) + ')', out: format(out), a: x,
          bars: [out[0] / 360, out[1], out[2], out[3]], labels: ['H', 'S', 'L', 'A'],
        };
      },
    },
    toHex: {
      stage: 'swatch', slider: { label: 'Alpha of the input', min: 0, max: 1, step: 0.01, value: 0.5 },
      view: function (c, color, v) {
        var x = c.transparentize(color, 1 - v);
        var out = c.toHex(x);
        return { code: 'toHex(' + quote(x) + ')', out: format(out), a: x, b: out };
      },
    },
    toRgba: {
      stage: 'swatch', slider: LIGHTNESS,
      view: function (c, color, v) {
        var x = shade(c, color, v);
        var out = c.toRgba(x);
        return { code: 'toRgba(' + quote(x) + ')', out: format(out), a: x, b: out };
      },
    },
    toHsla: {
      stage: 'swatch', slider: LIGHTNESS,
      view: function (c, color, v) {
        var x = shade(c, color, v);
        var out = c.toHsla(x);
        return { code: 'toHsla(' + quote(x) + ')', out: format(out), a: x, b: out };
      },
    },
    rgba: {
      stage: 'swatch', slider: { label: 'Red', min: 0, max: 255, step: 1, value: 255 },
      view: function (c, color, v) {
        var rgb = c.parseToRgba(color);
        var out = c.rgba(v, rgb[1], rgb[2], 1);
        return { code: 'rgba(' + [v, rgb[1], rgb[2], 1].join(', ') + ')', out: format(out), a: color, b: out };
      },
    },
    hsla: {
      stage: 'swatch', slider: { label: 'Hue', min: 0, max: 360, step: 1, value: 160 },
      view: function (c, color, v) {
        var hsl = c.parseToHsla(color);
        var s = +hsl[1].toFixed(2);
        var l = +hsl[2].toFixed(2);
        var out = c.hsla(v, s, l, 1);
        return { code: 'hsla(' + [v, s, l, 1].join(', ') + ')', out: format(out), a: color, b: out };
      },
    },
    darken: amount('darken', 0.5, 0.15),
    lighten: amount('lighten', 0.5, 0.15),
    saturate: amount('saturate', 0.5, 0.2),
    desaturate: amount('desaturate', 0.8, 0.3),
    adjustHue: {
      stage: 'swatch', slider: { label: 'Degrees', min: 0, max: 360, step: 1, value: 180 },
      view: function (c, color, v) {
        var out = c.adjustHue(color, v);
        return { code: 'adjustHue(' + quote(color) + ', ' + v + ')', out: format(out), a: color, b: out };
      },
    },
    opacify: {
      stage: 'swatch', slider: { label: 'Amount', min: 0, max: 0.8, step: 0.01, value: 0.4 },
      view: function (c, color, v) {
        var x = c.transparentize(color, 0.8);
        var out = c.opacify(x, v);
        return { code: 'opacify(' + quote(x) + ', ' + v + ')', out: format(out), a: x, b: out };
      },
    },
    transparentize: amount('transparentize', 1, 0.5),
    mix: {
      stage: 'mix', slider: { label: 'Weight', min: 0, max: 1, step: 0.01, value: 0.5 },
      view: function (c, color, v) {
        var out = c.mix(color, 'gold', v);
        return {
          code: 'mix(' + quote(color) + ", 'gold', " + v + ')', out: format(out),
          a: color, b: out, c: 'gold',
        };
      },
    },
    getScale: {
      stage: 'meter', slider: { label: 'Position on the scale', min: 0, max: 1, step: 0.01, value: 0.35 },
      view: function (c, color, v) {
        var scale = c.getScale(SCALE_ENDS[0], color, SCALE_ENDS[1]);
        var out = scale(v);
        return {
          code: 'getScale(' + quote(SCALE_ENDS[0]) + ', ' + quote(color) + ', ' + quote(SCALE_ENDS[1]) + ')(' + v + ')',
          out: format(out), b: out, p: v, q: v,
          g: 'linear-gradient(90deg,' + SCALE_ENDS[0] + ',' + c.toHex(color) + ',' + SCALE_ENDS[1] + ')',
        };
      },
    },
    getContrast: {
      stage: 'text', slider: LIGHTNESS,
      view: function (c, color, v) {
        var x = shade(c, opaque(c, color), v);
        var out = c.getContrast(x, 'white');
        return {
          code: 'getContrast(' + quote(x) + ", 'white')", out: format(out),
          a: '#fff', b: x, big: 'Contrast', chip: out.toFixed(2) + ':1',
        };
      },
    },
    getLuminance: {
      stage: 'meter', slider: LIGHTNESS,
      view: function (c, color, v) {
        var x = shade(c, color, v);
        var out = c.getLuminance(x);
        return {
          code: 'getLuminance(' + quote(x) + ')', out: format(out),
          b: x, p: out, q: out, g: 'linear-gradient(90deg,#000,#fff)',
        };
      },
    },
    hasBadContrast: {
      stage: 'text', slider: LIGHTNESS,
      view: function (c, color, v) {
        var x = shade(c, opaque(c, color), v);
        var out = c.hasBadContrast(x, 'aa');
        return {
          code: 'hasBadContrast(' + quote(x) + ", 'aa')", out: format(out),
          a: '#fff', b: x, big: 'Body text', chip: out ? 'Fails AA' : 'Passes AA',
        };
      },
    },
    readableColor: {
      stage: 'text', slider: LIGHTNESS,
      view: function (c, color, v) {
        var x = shade(c, opaque(c, color), v);
        var out = c.readableColor(x);
        return { code: 'readableColor(' + quote(x) + ')', out: format(out), a: x, b: out, big: 'Readable', chip: out };
      },
    },
    readableColorIsBlack: {
      stage: 'text', slider: LIGHTNESS,
      view: function (c, color, v) {
        var x = shade(c, opaque(c, color), v);
        var out = c.readableColorIsBlack(x);
        return {
          code: 'readableColorIsBlack(' + quote(x) + ')', out: format(out),
          a: x, b: out ? '#000' : '#fff', big: out ? 'Black text' : 'White text', chip: String(out),
        };
      },
    },
    guard: {
      stage: 'meter', slider: { label: 'Value', min: -0.5, max: 1.5, step: 0.01, value: 1.2 },
      view: function (c, color, v) {
        var out = c.guard(0, 1, v);
        return {
          code: 'guard(0, 1, ' + v + ')', out: format(out), b: color,
          p: (out + 0.5) / 2, q: (v + 0.5) / 2,
          g: 'linear-gradient(90deg,transparent 25%,' + c.transparentize(color, 0.6) + ' 25% 75%,transparent 75%)',
        };
      },
    },
    ColorError: {
      stage: 'text', slider: { label: 'Invalid input', min: 0, max: BAD_INPUTS.length - 1, step: 1, value: 0 },
      view: function (c, color, v) {
        var input = BAD_INPUTS[v];
        var out;
        try {
          out = format(c.parseToRgba(input));
        } catch (error) {
          out = (error instanceof c.ColorError ? 'ColorError: ' : 'Error: ') + error.message;
        }
        return {
          code: 'parseToRgba(' + quote(input) + ')', out: out,
          a: '#10131f', b: '#ff8fa3', big: 'ColorError', chip: 'thrown',
        };
      },
    },
  };

  function amount(name, max, value) {
    return {
      stage: 'swatch', slider: { label: 'Amount', min: 0, max: max, step: 0.01, value: value },
      view: function (c, color, v) {
        var out = c[name](color, v);
        return { code: name + '(' + quote(color) + ', ' + v + ')', out: format(out), a: color, b: out };
      },
    };
  }

  var STAGES = {
    swatch: '<i class="st-a"></i><i class="st-b"></i>',
    mix: '<i class="st-a"></i><i class="st-b"></i><i class="st-c"></i>',
    meter: '<i class="st-ghost"></i><i class="st-mark"></i>',
    text: '<strong data-slot="big"></strong><span data-slot="chip"></span>',
    bars: [0, 1, 2, 3]
      .map(function (i) {
        return '<span><b data-slot="l' + i + '"></b><i style="width:calc(var(--w' + i + ') * 100%)"></i></span>';
      })
      .join(''),
  };

  // The custom properties and text a view sets on its card.
  function variables(view) {
    var vars = {};
    ['a', 'b', 'c', 'p', 'q', 'g'].forEach(function (key) {
      if (view[key] !== undefined) vars['--' + key] = view[key];
    });
    (view.bars || []).forEach(function (bar, i) { vars['--w' + i] = +bar.toFixed(3); });
    return vars;
  }

  function slots(view) {
    var texts = { code: view.code, out: view.out, big: view.big, chip: view.chip };
    (view.labels || []).forEach(function (label, i) { texts['l' + i] = label; });
    return texts;
  }

  function cardHtml(c, name, group, color, link) {
    var demo = DEMOS[name];
    var view = demo.view(c, color, demo.slider.value);
    var vars = variables(view);
    var texts = slots(view);
    var style = Object.keys(vars)
      .map(function (key) { return key + ':' + vars[key]; })
      .join(';');
    var stage = STAGES[demo.stage].replace(/data-slot="(\w+)">/g, function (match, slot) {
      return match + escapeHtml(texts[slot]);
    });

    return (
      '<li class="demo" data-demo="' + name + '" data-group="' + escapeHtml(group) + '" style="' + escapeHtml(style) + '">' +
      '<h3><a href="' + link + '">' + name + '</a></h3>' +
      '<div class="st st-' + demo.stage + '" aria-hidden="true">' + stage + '</div>' +
      '<input type="range" class="needs-js" aria-label="' + escapeHtml(demo.slider.label) +
      '" min="' + demo.slider.min + '" max="' + demo.slider.max + '" step="' + demo.slider.step +
      '" value="' + demo.slider.value + '" />' +
      '<code class="demo-code" data-slot="code">' + escapeHtml(texts.code) + '</code>' +
      '<code class="demo-out" data-slot="out">' + escapeHtml(texts.out) + '</code>' +
      '</li>'
    );
  }

  // `groups` is `[{ title, items: [{ name, link }] }]`, from the API docs.
  function galleryHtml(c, groups, color) {
    return groups
      .map(function (group) {
        return group.items
          .map(function (item) {
            if (!DEMOS[item.name]) throw new Error('Add a demo for ' + item.name + ' to website/showcase.js');
            return cardHtml(c, item.name, group.title, color, item.link);
          })
          .join('');
      })
      .join('');
  }

  // ------------------------------------------------------------- browser ---

  function start(c) {
    var doc = document;
    var reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    var playing = !reduced.matches;
    var live = doc.getElementById('live');
    var gallery = doc.getElementById('gallery');
    var toggles = doc.querySelectorAll('[data-motion]');
    var text = doc.getElementById('gallery-text');
    var picker = doc.getElementById('gallery-picker');
    var error = doc.getElementById('gallery-error');
    var controls = doc.getElementById('gallery-controls');
    var color = text.value;
    var visible = typeof IntersectionObserver === 'undefined';
    var watcher = visible
      ? null
      : new IntersectionObserver(function (entries) {
          entries.forEach(function (entry) { entry.target.onScreen = entry.isIntersecting; });
        });

    function watch(element) {
      element.onScreen = visible;
      if (watcher) watcher.observe(element);
    }

    // Hero: look up the elements once, then only touch what changes.
    var banner = live.querySelector('.live-banner');
    var cells = live.querySelectorAll('.live-cells i');
    var liveSlots = {};
    live.querySelectorAll('[data-live]').forEach(function (element) {
      liveSlots[element.getAttribute('data-live')] = element;
    });
    watch(live);

    function drawHero(seconds) {
      var state = hero(c, seconds);
      var index = 0;
      banner.style.background = state.base;
      banner.style.color = state.readable;
      liveSlots.base.textContent = quote(state.base);
      liveSlots.readable.textContent = quote(state.readable);
      liveSlots.ratio.textContent = state.ratio;
      liveSlots.aa.setAttribute('data-pass', state.aa);
      liveSlots.aaa.setAttribute('data-pass', state.aaa);
      state.cells.forEach(function (row) {
        row.forEach(function (cell) { cells[index++].style.background = cell; });
      });
    }

    // Gallery: each card keeps its slider, and animates it until you take over.
    var cards = [];
    gallery.querySelectorAll('.demo').forEach(function (element, index) {
      var card = {
        element: element,
        demo: DEMOS[element.getAttribute('data-demo')],
        slider: element.querySelector('input'),
        slots: {},
        auto: true,
        phase: (index * 0.37) % 1,
      };
      element.querySelectorAll('[data-slot]').forEach(function (slot) {
        card.slots[slot.getAttribute('data-slot')] = slot;
      });
      card.slider.addEventListener('input', function () {
        card.auto = false;
        drawCard(card);
      });
      watch(element);
      cards.push(card);
    });

    function drawCard(card) {
      var view = card.demo.view(c, color, +card.slider.value);
      var vars = variables(view);
      var texts = slots(view);
      var key;
      for (key in vars) card.element.style.setProperty(key, vars[key]);
      for (key in texts) {
        if (card.slots[key] && card.slots[key].textContent !== texts[key]) {
          card.slots[key].textContent = texts[key];
        }
      }
    }

    function setColor(value, from) {
      try {
        // color2k parses loosely, so also turn away values like rgb(999, 0, 0).
        var rgb = c.parseToRgba(value);
        if (!(Math.max(rgb[0], rgb[1], rgb[2]) <= 255 && rgb[3] >= 0 && rgb[3] <= 1)) {
          throw new Error('Out of range: ' + value);
        }
      } catch (e) {
        error.textContent = e.message;
        text.setAttribute('aria-invalid', 'true');
        return;
      }
      color = value.trim();
      error.textContent = '';
      text.removeAttribute('aria-invalid');
      if (from !== text) text.value = color;
      if (from !== picker) picker.value = c.toHex(color).slice(0, 7);
      cards.forEach(drawCard);
    }

    text.addEventListener('input', function () { setColor(text.value, text); });
    picker.addEventListener('input', function () { setColor(picker.value, picker); });
    controls.addEventListener('click', function (event) {
      var preset = event.target.getAttribute('data-color');
      var group = event.target.getAttribute('data-filter');
      if (preset) setColor(preset);
      if (group !== null) {
        controls.querySelectorAll('[data-filter]').forEach(function (button) {
          button.setAttribute('aria-pressed', button === event.target);
        });
        cards.forEach(function (card) {
          card.element.hidden = group !== '' && card.element.getAttribute('data-group') !== group;
        });
      }
    });

    function setPlaying(next) {
      var wasPlaying = playing && started;
      playing = next;
      toggles.forEach(function (toggle) {
        toggle.setAttribute('aria-pressed', !playing);
        toggle.textContent = playing ? 'Pause motion' : 'Play motion';
      });
      if (playing && started && !wasPlaying) requestAnimationFrame(frame);
    }
    toggles.forEach(function (toggle) {
      toggle.addEventListener('click', function () { setPlaying(!playing); });
    });

    // One loop drives everything. It only redraws what is on screen, and about
    // ten times a second rather than on every frame: the colors move so little
    // per step that it reads as continuous, and the page stays mostly idle.
    var HERO_MS = 100;
    var CARD_MS = 100;
    var started = false;
    var clock = 0;
    var last = 0;
    var heroAt = 0;
    var cardsAt = 0;
    function frame(now) {
      if (!playing) {
        last = 0;
        return;
      }
      requestAnimationFrame(frame);
      if (doc.hidden) {
        last = 0;
        return;
      }
      clock += Math.min(now - (last || now), 100) / 1000;
      last = now;
      if (live.onScreen && now - heroAt >= HERO_MS) {
        heroAt = now;
        drawHero(clock);
      }
      if (now - cardsAt >= CARD_MS) {
        cardsAt = now;
        cards.forEach(function (card) {
          if (!card.auto || !card.element.onScreen || card.element.hidden) return;
          var slider = card.demo.slider;
          var wave = 0.5 - 0.5 * Math.cos((clock / 7 + card.phase) * 2 * Math.PI);
          var value = slider.min + wave * (slider.max - slider.min);
          value = String(+(Math.round(value / slider.step) * slider.step).toFixed(2));
          if (value !== card.slider.value) {
            card.slider.value = value;
            drawCard(card);
          }
        });
      }
    }

    // The controls work right away. Motion waits until the page has loaded.
    doc.documentElement.className += ' js';
    setPlaying(playing);
    function begin() {
      started = true;
      if (playing) requestAnimationFrame(frame);
    }
    var idle = window.requestIdleCallback || function (callback) { setTimeout(callback, 200); };
    if (doc.readyState === 'complete') idle(begin);
    else window.addEventListener('load', function () { idle(begin); });
    reduced.addEventListener('change', function () { setPlaying(!reduced.matches); });

    var copy = doc.getElementById('copy-install');
    if (copy && navigator.clipboard) {
      copy.addEventListener('click', function () {
        navigator.clipboard.writeText('npm i color2k').then(function () {
          copy.textContent = 'Copied';
          setTimeout(function () { copy.textContent = 'Copy'; }, 1500);
        });
      });
    }
  }

  return { galleryHtml: galleryHtml, heroHtml: heroHtml, start: start };
})();

if (typeof module !== 'undefined') module.exports = showcase;
