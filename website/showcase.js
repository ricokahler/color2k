// The live parts of the home page: the hero's color field, the theme studio
// and the function index.
//
// This one file runs in two places. The website build calls the `...Html`
// functions with the library to render the page's starting state, so it works
// without JavaScript. The page then loads this file and calls `start`.
// Keep it plain browser JavaScript, no imports.
//
// The rule for motion here: nothing touches the DOM on every frame unless you
// are dragging a color. The hero is one small canvas (a pixel per tile, scaled
// up by the GPU), and everything else that moves is a CSS transform or opacity.
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


  // --------------------------------------------------------------- field ---

  // The hero is a wall of tiles, one row per function. `w` is a wave from 0 to
  // 1 that rolls across the row, and `u` is how far along the row the tile is.
  var FIELD = [
    ['lighten', function (k, x, w) { return k.lighten(x.base, w * 0.34); }],
    ['getScale', function (k, x, w) { return x.scale(0.1 + w * 0.8); }],
    ['desaturate', function (k, x, w) { return k.desaturate(x.base, w * 0.85); }],
    ['adjustHue', function (k, x, w, u) { return k.adjustHue(x.base, u * 300 + w * 60); }],
    ['mix', function (k, x, w) { return k.mix(x.base, x.opposite, w); }],
    ['saturate', function (k, x, w) { return k.saturate(x.dull, w * 0.75); }],
    ['darken', function (k, x, w) { return k.darken(x.base, w * 0.44); }],
    ['transparentize', function (k, x, w) { return k.transparentize(x.base, w * 0.94); }],
  ];
  var INK = '#10131f';
  var TAU = Math.PI * 2;

  // Where the hero's color is `seconds` into its drift around the wheel.
  function drift(seconds) {
    return {
      hue: (228 + seconds * 10) % 360,
      light: 0.6 + 0.06 * Math.sin(seconds * 0.3),
    };
  }

  // Computes one frame: every tile's color, straight from color2k. `put` gets
  // each tile as (row, column, red, green, blue, alpha).
  function paintField(k, seconds, columns, at, put) {
    var base = k.toHex(k.hsla(at.hue, 0.85, at.light, 1));
    var x = {
      base: base,
      opposite: k.adjustHue(base, 180),
      dull: k.desaturate(base, 0.75),
      scale: k.getScale('#fff', base, INK),
    };

    for (var row = 0; row < FIELD.length; row++) {
      for (var column = 0; column < columns; column++) {
        var u = column / (columns - 1);
        var w = 0.5 + 0.5 * Math.sin(TAU * (u * 1.3 - seconds * 0.12 + row * 0.11));
        var rgb = k.parseToRgba(FIELD[row][1](k, x, w, u));
        put(row, column, rgb[0], rgb[1], rgb[2], rgb[3]);
      }
    }

    return base;
  }

  // The first frame as SVG, for the moment before the script runs (and for
  // when it never does).
  function fieldSvg(c, columns) {
    var rects = '';
    paintField(c, 0, columns, drift(0), function (row, column, r, g, b, a) {
      rects +=
        '<rect x="' + column + '" y="' + row + '" width="1.02" height="1.02" fill="' +
        c.toHex(c.rgba(r, g, b, 1)) + '"' + (a < 1 ? ' fill-opacity="' + +a.toFixed(2) + '"' : '') + '/>';
    });
    return (
      '<svg class="field-still" viewBox="0 0 ' + columns + ' ' + FIELD.length +
      '" preserveAspectRatio="none" aria-hidden="true">' + rects + '</svg>'
    );
  }

  function fieldRows() {
    return FIELD.map(function (row) { return row[0]; });
  }


  // -------------------------------------------------------------- themes ---

  // `accentHover` becomes `--accent-hover`.
  function tokenStyle(tokens) {
    return Object.keys(tokens)
      .filter(function (name) { return typeof tokens[name] === 'string'; })
      .map(function (name) {
        return '--' + name.replace(/[A-Z]/g, function (letter) { return '-' + letter.toLowerCase(); }) + ':' + tokens[name];
      })
      .join(';');
  }

  // The three contrast figures shown next to each theme.
  function themeRatios(c, tokens) {
    return {
      text: c.getContrast(tokens.text, tokens.bg).toFixed(1) + ':1',
      button: c.getContrast(tokens.onAccent, tokens.accent).toFixed(1) + ':1',
      chip: c.getContrast(tokens.onSoft, tokens.soft).toFixed(1) + ':1',
    };
  }

  // What each theme decided about the color, in words. `line` names the
  // variable in the builder that makes the call (the page shows that line of
  // code), `pick` reads the builder's `why`, and `says` is "because, so" for
  // each outcome.
  var WHY = {
    soft: [
      {
        line: 'calm',
        pick: function (why) { return why.vivid ? 0 : why.faint ? 1 : 2; },
        says: [
          ['Your color is very saturated', 'it is toned down with desaturate to keep the page calm'],
          ['Your color is nearly gray', 'it is lifted with saturate to give the page a wash'],
          ['Your color is already gentle', 'its saturation is left alone'],
        ],
      },
      {
        line: 'clash',
        pick: function (why) { return why.clash ? 0 : 1; },
        says: [
          ['A label would not read on your color, or it would melt into the page', 'the button gets a pastel of the same hue'],
          ['A dark label reads on your color', 'it becomes the button'],
        ],
      },
    ],
    serious: [
      {
        line: 'weak',
        pick: function (why) { return why.weak ? 0 : 1; },
        says: [
          ['Your color is too faint to read as a link on this page', 'it is nudged a step at a time until it passes AA'],
          ['Your color already reads on this page', 'it is the link and the button with no nudge'],
        ],
      },
      {
        line: 'darkLabel',
        pick: function (why) { return why.darkLabel ? 0 : 1; },
        says: [
          ['The button came out light', 'its label is black'],
          ['The button came out dark', 'its label is white'],
        ],
      },
    ],
    bold: [
      {
        line: 'brand',
        pick: function (why) { return why.dull ? 0 : 1; },
        says: [
          ['Your color is muted', 'it is turned up with saturate, because Bold needs volume'],
          ['Your color is already vivid', 'it is used at full strength'],
        ],
      },
      {
        line: 'tinted',
        pick: function (why) { return why.tinted ? 0 : 1; },
        says: [
          ['The page came out dark', 'text goes white and the card is a lighter tint of the page'],
          ['The page came out light', 'text, the card and the hard shadows go black'],
        ],
      },
      {
        line: 'accent',
        pick: function (why) { return why.lost ? 0 : 1; },
        says: [
          ['The hue next door would disappear on the card', 'the button falls back to black or white'],
          ['The hue next door stands out on the card', 'it becomes the button'],
        ],
      },
    ],
  };

  // The sentences for one theme, given what its builder decided.
  function whyRows(key, why) {
    return WHY[key].map(function (row) {
      var says = row.says[row.pick(why)];
      return { line: row.line, text: says[0] + ', so ' + says[1] + '.' };
    });
  }

  // A theme fell back on something when its builder had to step in.
  function adjusted(why) {
    return Boolean(why.clash || why.weak || why.lost);
  }

  // The pad you paint on: hue across, lightness down.
  function padColor(c, x, y) {
    return c.toHex(c.hsla(Math.round(x * 360) % 360, 0.9, 0.88 - y * 0.5, 1));
  }

  // ----------------------------------------------------------- functions ---

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
  // The contrast demos start darker, so their sample text starts out readable.
  var DARKER = { label: 'Lightness of the input', min: -0.4, max: 0.4, step: 0.01, value: -0.3 };
  var SCALE_ENDS = ['gold', 'midnightblue'];
  var BAD_INPUTS = ['rgb(1 2 3)', '#12345', 'oklch(70% 0.1 200)', 'hsl(0, 200%, 50%)', 'not a color'];

  // One example per export: the argument it is called with (`slider.value`)
  // and a `view` that returns the line of code and what it gave back.
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
      stage: 'text', slider: DARKER,
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
      stage: 'text', slider: DARKER,
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


  // The example for one export, on a color. `swatch` is the color to show
  // beside it: the result when the result is a color, the input otherwise.
  function example(c, name, color) {
    var view = DEMOS[name].view(c, color, DEMOS[name].slider.value);
    // When the result is not a color, show the color that went in.
    var swatch = (DEMOS[name].stage === 'text' ? view.b : view.a) || color;
    if (view.out.charAt(0) === "'") {
      try {
        c.parseToRgba(view.out.slice(1, -1));
        swatch = view.out.slice(1, -1);
      } catch (e) {
        // Not a color. Keep the input.
      }
    }
    return { code: view.code, out: view.out, swatch: swatch };
  }

  // The index of every export. `groups` is
  // `[{ title, items: [{ name, display, summary, link, size }] }]`, from the
  // API docs, so nothing can be exported without showing up here.
  function functionsHtml(c, groups, color) {
    return groups
      .map(function (group) {
        return (
          '<section class="fn-group" data-group="' + escapeHtml(group.title) + '">' +
          '<h3>' + escapeHtml(group.title) + '</h3><ul>' +
          group.items
            .map(function (item) {
              if (!DEMOS[item.name]) throw new Error('Add an example for ' + item.name + ' to website/showcase.js');
              var shown = example(c, item.name, color);
              return (
                '<li class="fn" data-fn="' + item.name + '" data-search="' +
                escapeHtml((item.display + ' ' + item.summary + ' ' + group.title).toLowerCase()) + '">' +
                '<p class="fn-head"><a href="' + item.link + '"><code>' + escapeHtml(item.display) + '</code></a>' +
                '<span class="fn-size">' + escapeHtml(item.size) + '</span></p>' +
                '<p class="fn-what">' + escapeHtml(item.summary) + '</p>' +
                '<p class="fn-try"><i style="--c:' + escapeHtml(shown.swatch) + '"></i>' +
                '<span><code data-slot="code">' + escapeHtml(shown.code) + '</code>' +
                '<code class="fn-out" data-slot="out">' + escapeHtml(shown.out) + '</code></span></p>' +
                '</li>'
              );
            })
            .join('') +
          '</ul></section>'
        );
      })
      .join('');
  }

  // ------------------------------------------------------------- browser ---

  function start(c, themes) {
    var doc = document;
    var root = doc.documentElement;
    var reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    var hasObserver = typeof IntersectionObserver !== 'undefined';

    function watch(element, onChange) {
      element.onScreen = !hasObserver;
      if (!hasObserver) return;
      new IntersectionObserver(function (entries) {
        element.onScreen = entries[entries.length - 1].isIntersecting;
        if (onChange) onChange(element.onScreen);
      }).observe(element);
    }

    function setText(node, value) {
      if (node && node.nodeValue !== value) node.nodeValue = value;
    }

    // ---- hero: one canvas, one pixel per tile -----------------------------
    var hero = doc.getElementById('hero');
    var canvas = doc.getElementById('field');
    var toggle = doc.getElementById('motion');
    var context = canvas.getContext('2d');
    var columns = 0;
    var image = null;
    var playing = false;
    var running = false;
    var seconds = 0;
    var last = 0;
    // Only the newest loop is allowed to draw, so pausing and resuming
    // quickly can never leave two of them running.
    var loop = 0;

    function measure() {
      // About one tile per 52 pixels, so a phone computes fewer than a desktop.
      var next = Math.max(8, Math.min(40, Math.round(canvas.clientWidth / 52)));
      if (next === columns) return;
      columns = next;
      // The grid of gaps drawn over the canvas has to match it.
      hero.style.setProperty('--columns', columns);
      canvas.width = columns;
      canvas.height = fieldRows().length;
      image = context.createImageData(columns, canvas.height);
    }

    function put(row, column, r, g, b, a) {
      var i = (row * columns + column) * 4;
      image.data[i] = r;
      image.data[i + 1] = g;
      image.data[i + 2] = b;
      image.data[i + 3] = a * 255;
    }

    function draw() {
      paintField(c, seconds, columns, drift(seconds), put);
      context.putImageData(image, 0, 0);
    }

    function sync() {
      var should = playing && hero.onScreen;
      if (should && !running) {
        var id = ++loop;
        running = true;
        last = 0;
        requestAnimationFrame(function step(time) {
          if (!running || id !== loop) return;
          seconds += Math.min(time - (last || time), 100) / 1000;
          last = time;
          draw();
          requestAnimationFrame(step);
        });
      } else if (!should && running) {
        running = false;
        loop++;
      }
    }

    function setPlaying(next) {
      playing = next;
      toggle.setAttribute('aria-pressed', String(!playing));
      setText(toggle.firstChild, playing ? 'Pause' : 'Play');
      sync();
    }

    measure();
    watch(hero, sync);
    window.addEventListener('resize', function () {
      measure();
      if (!running) draw();
    });
    toggle.addEventListener('click', function () { setPlaying(!playing); });
    reduced.addEventListener('change', function () { setPlaying(!reduced.matches); });

    // ---- studio: one color in, three looks out ----------------------------
    var studio = doc.getElementById('themes');
    var text = doc.getElementById('studio-text');
    var picker = doc.getElementById('studio-picker');
    var error = doc.getElementById('studio-error');
    var pad = doc.getElementById('studio-pad');
    var slider = doc.getElementById('studio-slider');
    var thumb = doc.getElementById('studio-thumb');
    var wash = doc.getElementById('studio-wash');
    var modeToggle = doc.getElementById('studio-mode');
    var spinToggle = doc.getElementById('studio-spin');
    var color = text.value;
    // The color as you gave it, which is what the text field shows.
    var shown = color;
    var dark = false;
    var pending = false;
    var glide = 0;
    var spinning = 0;
    var spins = 0;
    var spot = { x: 0, y: 0, width: 1, height: 1 };
    var looks = [];
    studio.querySelectorAll('.look').forEach(function (element) {
      var key = element.getAttribute('data-theme');
      var look = {
        key: key,
        build: themes[key],
        card: element.querySelector('.tcard'),
        tile: doc.querySelector('[data-tile="' + key + '"]'),
        ratios: {},
        rows: [],
        tokens: null,
        stale: false,
        decided: '',
      };
      element.querySelectorAll('[data-ratio]').forEach(function (node) {
        look.ratios[node.getAttribute('data-ratio')] = node.firstChild;
      });
      element.querySelectorAll('[data-why]').forEach(function (node) {
        look.rows.push(node.firstChild);
      });
      watch(look.card, function (onScreen) {
        if (onScreen && look.stale) paintLook(look);
      });
      looks.push(look);
    });

    // The numbers and form fields that describe the color. Changing text means
    // layout, so while you paint these catch up eight times a second, not on
    // every frame, and once more when you stop.
    var labelled = 0;
    var labelTimer = 0;
    function label() {
      labelled = performance.now();
      labelTimer = 0;
      looks.forEach(function (look) {
        var ratios = themeRatios(c, look.tokens);
        setText(look.ratios.text, ratios.text);
        setText(look.ratios.button, ratios.button);
        setText(look.ratios.chip, ratios.chip);
      });
      var hex = c.toHex(color);
      if (doc.activeElement !== text && text.value !== shown) text.value = shown;
      if (picker.value !== hex.slice(0, 7)) picker.value = hex.slice(0, 7);
      slider.setAttribute('aria-valuetext', shown);
      slider.setAttribute('aria-valuenow', String(Math.round(spot.x * 360)));
    }

    function paintLook(look) {
      var tokens = look.tokens;
      look.stale = false;
      look.card.style.cssText = tokenStyle(tokens);
    }

    // The sentences under a card. They only change when a decision does, so
    // they are kept current even while the card itself is off screen.
    function explain(look) {
      var decided = JSON.stringify(look.tokens.why);
      if (decided === look.decided) return;
      look.decided = decided;
      look.card.setAttribute('data-adjusted', String(adjusted(look.tokens.why)));
      whyRows(look.key, look.tokens.why).forEach(function (row, i) {
        setText(look.rows[i], row.text);
      });
    }

    // Runs at most once a frame, however fast the pointer moves. Each card
    // on screen gets one style write, and nothing here causes layout.
    function apply() {
      pending = false;
      looks.forEach(function (look, index) {
        look.tokens = look.build(color, dark);
        // The small tile in the bar always follows, so all three are in view
        // together even on a phone.
        look.tile.style.cssText = tokenStyle(look.tokens);
        explain(look);
        // A card that is off screen (swiped away on a phone, say) waits.
        if (look.card.onScreen) paintLook(look);
        else look.stale = true;
        // The section behind the cards takes the first theme's page color.
        if (index === 0) wash.style.background = look.tokens.bg;
      });
      if (performance.now() - labelled >= 120) label();
      else if (!labelTimer) labelTimer = setTimeout(label, 130);
      rows.forEach(function (row) {
        row.stale = true;
        if (row.element.onScreen) drawRow(row);
      });
    }

    function schedule() {
      if (pending) return;
      pending = true;
      requestAnimationFrame(apply);
    }

    function parses(value) {
      try {
        // color2k parses loosely, so also turn away values like rgb(999, 0, 0).
        var rgb = c.parseToRgba(value);
        if (!(Math.max(rgb[0], rgb[1], rgb[2]) <= 255 && rgb[3] >= 0 && rgb[3] <= 1)) {
          throw new Error('Out of range: ' + value);
        }
        return true;
      } catch (e) {
        // Echo a long entry back shortened, so it cannot stretch the page.
        var message = e.message;
        error.textContent = message.length > 72 ? message.slice(0, 69) + '..."' : message;
        text.setAttribute('aria-invalid', 'true');
        return false;
      }
    }

    // `smooth` slides from the old color to the new one along a getScale, for
    // jumps like a preset. Painting sets the color at once.
    function setColor(value, from, smooth) {
      if (!parses(value)) return;
      var target = value.trim();
      var id = ++glide;
      shown = target;
      if (error.textContent) error.textContent = '';
      if (text.hasAttribute('aria-invalid')) text.removeAttribute('aria-invalid');
      if (from !== slider) {
        thumb.hidden = true;
        spinning = 0;
      }

      if (!smooth || reduced.matches) {
        color = target;
        schedule();
        return;
      }

      var scale = c.getScale(color, target);
      var began = 0;
      requestAnimationFrame(function step(time) {
        if (id !== glide) return;
        began = began || time;
        var progress = Math.min(1, (time - began) / 420);
        // Ease out, so it lands softly.
        color = progress < 1 ? scale(1 - Math.pow(1 - progress, 3)) : target;
        schedule();
        if (progress < 1) requestAnimationFrame(step);
      });
    }

    // The pad is drawn once, a pixel per swatch, and scaled up like the hero.
    function drawPad() {
      var padContext = pad.getContext('2d');
      var padImage = padContext.createImageData(pad.width, pad.height);
      for (var py = 0; py < pad.height; py++) {
        for (var px = 0; px < pad.width; px++) {
          var swatchRgb = c.parseToRgba(padColor(c, px / pad.width, py / (pad.height - 1)));
          var offset = (py * pad.width + px) * 4;
          padImage.data[offset] = swatchRgb[0];
          padImage.data[offset + 1] = swatchRgb[1];
          padImage.data[offset + 2] = swatchRgb[2];
          padImage.data[offset + 3] = 255;
        }
      }
      padContext.putImageData(padImage, 0, 0);
    }

    // Puts the thumb at a point on the pad (0 to 1 each way) and paints with
    // the color there. The thumb moves by transform only.
    function paintAt(x, y) {
      spot.x = Math.max(0, Math.min(1, x));
      spot.y = Math.max(0, Math.min(1, y));
      thumb.hidden = false;
      thumb.style.transform =
        'translate(' + spot.x * spot.width + 'px,' + spot.y * spot.height + 'px)';
      setColor(padColor(c, spot.x, spot.y), slider);
    }

    function measurePad() {
      var box = slider.getBoundingClientRect();
      spot.left = box.left;
      spot.top = box.top;
      spot.width = box.width;
      spot.height = box.height;
    }

    function paint(event) {
      paintAt((event.clientX - spot.left) / spot.width, (event.clientY - spot.top) / spot.height);
    }

    slider.addEventListener('pointerdown', function (event) {
      spinning = 0;
      measurePad();
      slider.setPointerCapture(event.pointerId);
      paint(event);
    });
    slider.addEventListener('pointermove', function (event) {
      if (slider.hasPointerCapture(event.pointerId)) paint(event);
    });
    // The same pad from the keyboard: left and right change the hue, up and
    // down the lightness. Shift takes bigger steps.
    slider.addEventListener('keydown', function (event) {
      var step = event.shiftKey ? 5 : 1;
      var moves = {
        ArrowLeft: [-step / 72, 0],
        ArrowRight: [step / 72, 0],
        ArrowUp: [0, -1 / 8],
        ArrowDown: [0, 1 / 8],
        Home: [-1, 0],
        End: [1, 0],
      };
      var move = moves[event.key];
      if (!move) return;
      event.preventDefault();
      spinning = 0;
      measurePad();
      if (thumb.hidden) spot.y = 0.35;
      paintAt(spot.x + move[0], spot.y + move[1]);
    });
    text.addEventListener('input', function () { setColor(text.value, text, true); });
    picker.addEventListener('input', function () { setColor(picker.value, picker); });
    studio.addEventListener('click', function (event) {
      var preset = event.target.getAttribute && event.target.getAttribute('data-color');
      if (preset) setColor(preset, null, true);
    });

    function setDark(next) {
      dark = next;
      studio.setAttribute('data-mode', dark ? 'dark' : 'light');
      modeToggle.setAttribute('aria-pressed', String(dark));
      schedule();
    }
    modeToggle.addEventListener('click', function () { setDark(!dark); });

    // One trip around the wheel, for watching the themes change on their own.
    spinToggle.addEventListener('click', function () {
      if (spinning) {
        spinning = 0;
        return;
      }
      var from = thumb.hidden ? 0.92 : spot.x;
      measurePad();
      // With reduced motion there is no trip. It lands a third of the way on.
      if (reduced.matches) {
        paintAt((from + 1 / 3) % 1, 0.3);
        return;
      }
      var id = (spinning = ++spins);
      var began = 0;
      requestAnimationFrame(function step(time) {
        if (spinning !== id) return;
        began = began || time;
        var turn = (time - began) / 9000;
        if (turn >= 1) {
          spinning = 0;
          return;
        }
        paintAt((from + turn) % 1, 0.3 + 0.12 * Math.sin(turn * TAU * 2));
        requestAnimationFrame(step);
      });
    });

    // ---- functions: every export, on your color ---------------------------
    var index = doc.getElementById('functions');
    var search = doc.getElementById('fn-search');
    var none = doc.getElementById('fn-none');
    var rows = [];
    index.querySelectorAll('.fn').forEach(function (element) {
      var row = {
        element: element,
        name: element.getAttribute('data-fn'),
        words: element.getAttribute('data-search'),
        group: element.parentNode.parentNode,
        swatch: element.querySelector('.fn-try i'),
        code: element.querySelector('[data-slot="code"]').firstChild,
        out: element.querySelector('[data-slot="out"]').firstChild,
        shown: '',
        stale: false,
      };
      watch(element, function (onScreen) {
        if (onScreen && row.stale) drawRow(row);
      });
      rows.push(row);
    });

    function drawRow(row) {
      var shown = example(c, row.name, color);
      row.stale = false;
      setText(row.code, shown.code);
      setText(row.out, shown.out);
      if (shown.swatch !== row.shown) {
        row.shown = shown.swatch;
        row.swatch.style.setProperty('--c', shown.swatch);
      }
    }

    // Type to find a function by its name or by what it does.
    search.addEventListener('input', function () {
      var words = search.value.toLowerCase().trim().split(/\s+/);
      var found = 0;
      var groups = [];
      rows.forEach(function (row) {
        var match = words.every(function (word) { return row.words.indexOf(word) !== -1; });
        row.element.hidden = !match;
        if (match) {
          found++;
          if (groups.indexOf(row.group) === -1) groups.push(row.group);
        }
      });
      index.querySelectorAll('.fn-group').forEach(function (group) {
        group.hidden = groups.indexOf(group) === -1;
      });
      none.hidden = found > 0;
    });

    // ---- the rest ----------------------------------------------------------
    // The header marks the section you are in.
    if (hasObserver) {
      var links = {};
      doc.querySelectorAll('.site-nav [data-spy]').forEach(function (link) {
        links[link.getAttribute('data-spy')] = link;
      });
      var spy = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (!entry.isIntersecting) return;
            Object.keys(links).forEach(function (id) {
              if (id === entry.target.id) links[id].setAttribute('aria-current', 'true');
              else links[id].removeAttribute('aria-current');
            });
          });
        },
        { rootMargin: '-45% 0px -50% 0px' }
      );
      Object.keys(links).forEach(function (id) {
        var section = doc.getElementById(id);
        if (section) spy.observe(section);
      });
    }

    // Sections slide in with CSS scroll-driven animations where the browser has
    // them. Elsewhere, an observer adds a class and a transition does the same.
    if (!(window.CSS && CSS.supports('animation-timeline: view()')) && hasObserver && !reduced.matches) {
      root.className += ' io';
      var reveal = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (!entry.isIntersecting) return;
            entry.target.className += ' in';
            reveal.unobserve(entry.target);
          });
        },
        { rootMargin: '0px 0px -10% 0px' }
      );
      doc.querySelectorAll('.reveal').forEach(function (element) { reveal.observe(element); });
    }

    var copy = doc.getElementById('copy-install');
    if (copy && navigator.clipboard) {
      copy.addEventListener('click', function () {
        navigator.clipboard.writeText('npm i color2k').then(function () {
          copy.textContent = 'Copied';
          setTimeout(function () { copy.textContent = 'Copy'; }, 1500);
        });
      });
    }

    root.className += ' js';

    // The controls above work at once. The drawing waits until the page has
    // loaded and the browser has a spare moment, so it never delays either.
    function begin() {
      drawPad();
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) setDark(true);
      draw();
      hero.setAttribute('data-ready', '');
      setPlaying(!reduced.matches);
    }
    var idle = window.requestIdleCallback || function (callback) { setTimeout(callback, 200); };
    if (doc.readyState === 'complete') idle(begin);
    else window.addEventListener('load', function () { idle(begin); });
  }

  return {
    adjusted: adjusted,
    fieldRows: fieldRows,
    fieldSvg: fieldSvg,
    functionsHtml: functionsHtml,
    padColor: padColor,
    themeRatios: themeRatios,
    tokenStyle: tokenStyle,
    whyRows: whyRows,
    start: start,
  };
})();

if (typeof module !== 'undefined') module.exports = showcase;
