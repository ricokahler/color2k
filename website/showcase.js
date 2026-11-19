// The live parts of the home page: the hero's color field, the theme studio
// and the function gallery.
//
// This one file runs in two places. The website build calls the `...Html`
// functions with the library to render the page's starting state, so it works
// without JavaScript. The page then loads this file and calls `start`.
// Keep it plain browser JavaScript, no imports.
//
// The rule for motion here: nothing touches the DOM on every frame. The hero
// is one small canvas (a pixel per tile, scaled up by the GPU), and everything
// else that moves is a CSS transform or opacity.
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

  // What the chip under the hero says about the current color.
  function chip(c, base) {
    var readable = c.readableColor(base);
    return {
      base: base,
      readable: readable,
      ratio: c.getContrast(base, readable).toFixed(2) + ':1',
    };
  }

  function heroChip(c) {
    var at = drift(0);
    return chip(c, c.toHex(c.hsla(at.hue, 0.85, at.light, 1)));
  }

  // -------------------------------------------------------------- themes ---

  // `accentHover` becomes `--accent-hover`.
  function tokenStyle(tokens) {
    return Object.keys(tokens)
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

  // The pad you paint on: hue across, lightness down.
  function padColor(c, x, y) {
    return c.toHex(c.hsla(Math.round(x * 360) % 360, 0.9, 0.88 - y * 0.5, 1));
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

  function cardHtml(c, name, group, color, link, size) {
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
      '<h3><a href="' + link + '">' + name + '</a><span>' + escapeHtml(size) + '</span></h3>' +
      '<div class="st st-' + demo.stage + '" aria-hidden="true">' + stage + '</div>' +
      '<input type="range" class="needs-js" aria-label="' + escapeHtml(demo.slider.label) +
      '" min="' + demo.slider.min + '" max="' + demo.slider.max + '" step="' + demo.slider.step +
      '" value="' + demo.slider.value + '" />' +
      '<code class="demo-code" data-slot="code">' + escapeHtml(texts.code) + '</code>' +
      '<code class="demo-out" data-slot="out">' + escapeHtml(texts.out) + '</code>' +
      '</li>'
    );
  }

  // `groups` is `[{ title, items: [{ name, link, size }] }]`, from the API docs.
  function galleryHtml(c, groups, color) {
    return groups
      .map(function (group) {
        return group.items
          .map(function (item) {
            if (!DEMOS[item.name]) throw new Error('Add a demo for ' + item.name + ' to website/showcase.js');
            return cardHtml(c, item.name, group.title, color, item.link, item.size);
          })
          .join('');
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

    // Counts every color2k call the hero makes, so the scoreboard is honest.
    var calls = 0;
    var counted = {};
    Object.keys(c).forEach(function (name) {
      counted[name] = function (a, b, d, e) {
        calls++;
        return c[name](a, b, d, e);
      };
    });
    // getScale takes any number of colors and hands back a function.
    counted.getScale = function (a, b, d) {
      calls++;
      var scale = c.getScale(a, b, d);
      return function (n) {
        calls++;
        return scale(n);
      };
    };

    // ---- hero: one canvas, one pixel per tile -----------------------------
    var hero = doc.getElementById('hero');
    var canvas = doc.getElementById('field');
    var swatch = doc.getElementById('chip-swatch');
    var chipBox = doc.getElementById('chip');
    var toggle = doc.getElementById('motion');
    var slot = {};
    hero.querySelectorAll('[data-live]').forEach(function (element) {
      slot[element.getAttribute('data-live')] = element.firstChild;
    });

    var context = canvas.getContext('2d');
    var swatchContext = swatch.getContext('2d');
    var columns = 0;
    var image = null;
    var playing = !reduced.matches;
    var running = false;
    var seconds = 0;
    var last = 0;
    var at = drift(0);
    var pointer = null;
    var base = '';
    var ink = '';
    // Rolling numbers for the scoreboard, refreshed twice a second.
    var frames = 0;
    var spent = 0;
    var since = 0;

    function measure() {
      // About one tile per 52 pixels, so a phone computes fewer than a desktop.
      var next = Math.max(10, Math.min(40, Math.round(hero.clientWidth / 52)));
      if (next === columns) return;
      columns = next;
      // The grid of gaps drawn over the canvas has to match it.
      hero.style.setProperty('--columns', columns);
      canvas.width = columns;
      canvas.height = FIELD.length;
      image = context.createImageData(columns, FIELD.length);
    }

    function put(row, column, r, g, b, a) {
      var i = (row * columns + column) * 4;
      image.data[i] = r;
      image.data[i + 1] = g;
      image.data[i + 2] = b;
      image.data[i + 3] = a * 255;
    }

    function draw() {
      calls = 0;
      var began = performance.now();
      base = paintField(counted, seconds, columns, at, put);
      var now = chip(counted, base);
      spent += performance.now() - began;
      frames++;

      context.putImageData(image, 0, 0);
      swatchContext.fillStyle = base;
      swatchContext.fillRect(0, 0, 1, 1);
      if (now.readable !== ink) {
        // Switch at once, so the text is never caught on the wrong side.
        ink = now.readable;
        chipBox.style.color = ink;
      }
      return now;
    }

    function report(now, time, still) {
      var fps = still ? 0 : (frames * 1000) / (time - since);
      setText(slot.base, quote(now.base));
      setText(slot.readable, quote(now.readable));
      setText(slot.ratio, now.ratio);
      setText(slot.calls, String(calls));
      setText(slot.ms, (spent / frames).toFixed(2));
      setText(slot.rate, (Math.round((calls * fps) / 100) * 100).toLocaleString('en-US'));
      setText(slot.fps, String(Math.round(fps)));
      frames = 0;
      spent = 0;
      since = time;
    }

    function frame(time) {
      if (!running) return;
      var delta = Math.min(time - (last || time), 100) / 1000;
      last = time;
      seconds += delta;

      if (pointer) {
        // Ease toward the pointer the short way around the wheel.
        var turn = ((pointer.hue - at.hue + 540) % 360) - 180;
        var pull = 1 - Math.exp(-delta * 6);
        at.hue = (at.hue + turn * pull + 360) % 360;
        at.light += (pointer.light - at.light) * pull;
      } else {
        at.hue = (at.hue + delta * 10) % 360;
        at.light += (0.6 + 0.06 * Math.sin(seconds * 0.3) - at.light) * (1 - Math.exp(-delta * 2));
      }

      var now = draw();
      if (time - since >= 500) report(now, time);
      requestAnimationFrame(frame);
    }

    function sync() {
      var should = playing && hero.onScreen;
      if (should && !running) {
        running = true;
        last = 0;
        since = performance.now();
        frames = 0;
        spent = 0;
        requestAnimationFrame(frame);
      } else if (!should) {
        running = false;
      }
    }

    function setPlaying(next) {
      playing = next;
      toggle.setAttribute('aria-pressed', String(!playing));
      setText(toggle.firstChild, playing ? 'Pause' : 'Play');
      sync();
    }

    measure();
    // A few frames straight away, so a paused page still shows real numbers
    // (the first ones only warm the engine up).
    draw();
    draw();
    frames = 0;
    spent = 0;
    report(draw(), performance.now(), true);
    canvas.setAttribute('data-ready', '');
    watch(hero, sync);
    window.addEventListener('resize', function () {
      measure();
      if (!running) draw();
    });
    hero.addEventListener('pointermove', function (event) {
      if (event.pointerType === 'touch') return;
      var box = hero.getBoundingClientRect();
      pointer = {
        hue: ((event.clientX - box.left) / box.width) * 360,
        light: 0.72 - ((event.clientY - box.top) / box.height) * 0.28,
      };
    });
    hero.addEventListener('pointerleave', function () { pointer = null; });
    toggle.addEventListener('click', function () { setPlaying(!playing); });
    reduced.addEventListener('change', function () { setPlaying(!reduced.matches); });

    // ---- studio: one color in, three themes out ---------------------------
    var studio = doc.getElementById('themes');
    var text = doc.getElementById('studio-text');
    var picker = doc.getElementById('studio-picker');
    var error = doc.getElementById('studio-error');
    var pad = doc.getElementById('studio-pad');
    var thumb = doc.getElementById('studio-thumb');
    var color = text.value;
    var pending = false;
    var bands = [];
    studio.querySelectorAll('[data-theme]').forEach(function (element) {
      var ratios = {};
      element.querySelectorAll('[data-ratio]').forEach(function (node) {
        ratios[node.getAttribute('data-ratio')] = node.firstChild;
      });
      var band = {
        element: element,
        stale: false,
        build: themes[element.getAttribute('data-theme')],
        light: element.querySelectorAll('[data-tokens="light"]'),
        dark: element.querySelectorAll('[data-tokens="dark"]'),
        ratios: ratios,
      };
      // A theme that is off screen waits until you scroll to it.
      watch(element, function (onScreen) {
        if (onScreen && band.stale) paintBand(band);
      });
      bands.push(band);
    });

    function setTokens(elements, tokens) {
      var style = tokenStyle(tokens);
      for (var i = 0; i < elements.length; i++) elements[i].style.cssText = style;
    }

    function paintBand(band) {
      var light = band.build(color, false);
      var ratios = themeRatios(c, light);
      band.stale = false;
      setTokens(band.light, light);
      setTokens(band.dark, band.build(color, true));
      setText(band.ratios.text, ratios.text);
      setText(band.ratios.button, ratios.button);
      setText(band.ratios.chip, ratios.chip);
    }

    // Runs at most once a frame, however fast the pointer moves.
    function apply() {
      pending = false;
      bands.forEach(function (band) {
        if (band.element.onScreen) paintBand(band);
        else band.stale = true;
      });
      cards.forEach(function (card) {
        card.stale = true;
        if (card.element.onScreen) drawCard(card);
      });
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
      if (error.textContent) error.textContent = '';
      text.removeAttribute('aria-invalid');
      if (from !== text) text.value = color;
      if (from !== picker) picker.value = c.toHex(color).slice(0, 7);
      if (from !== pad) thumb.hidden = true;
      if (!pending) {
        pending = true;
        requestAnimationFrame(apply);
      }
    }

    // The pad is drawn once, a pixel per swatch, and scaled up like the hero.
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

    function paint(event) {
      var box = pad.getBoundingClientRect();
      var x = Math.max(0, Math.min(1, (event.clientX - box.left) / box.width));
      var y = Math.max(0, Math.min(1, (event.clientY - box.top) / box.height));
      thumb.hidden = false;
      thumb.style.transform = 'translate(' + x * box.width + 'px,' + y * box.height + 'px)';
      setColor(padColor(c, x, y), pad);
    }
    pad.addEventListener('pointerdown', function (event) {
      pad.setPointerCapture(event.pointerId);
      paint(event);
    });
    pad.addEventListener('pointermove', function (event) {
      if (pad.hasPointerCapture(event.pointerId)) paint(event);
    });
    text.addEventListener('input', function () { setColor(text.value, text); });
    picker.addEventListener('input', function () { setColor(picker.value, picker); });
    studio.addEventListener('click', function (event) {
      var preset = event.target.getAttribute && event.target.getAttribute('data-color');
      if (preset) setColor(preset);
    });
    doc.getElementById('use-color').addEventListener('click', function () {
      setColor(base);
    });

    // ---- gallery: every function on your color -----------------------------
    var gallery = doc.getElementById('gallery');
    var filters = doc.getElementById('gallery-filters');
    var cards = [];
    gallery.querySelectorAll('.demo').forEach(function (element) {
      var card = {
        element: element,
        demo: DEMOS[element.getAttribute('data-demo')],
        slider: element.querySelector('input'),
        stage: element.querySelector('.st'),
        parts: element.querySelectorAll('.st i'),
        slots: {},
        last: {},
        stale: false,
      };
      element.querySelectorAll('[data-slot]').forEach(function (node) {
        card.slots[node.getAttribute('data-slot')] = node.firstChild;
      });
      card.slider.addEventListener('input', function () { drawCard(card); });
      watch(element, function (onScreen) {
        if (onScreen && card.stale) drawCard(card);
      });
      cards.push(card);
    });

    // Writes one style on one element, and only when it changed. (Updating
    // the card's custom properties instead would restyle the whole card.)
    function place(card, key, element, property, value) {
      if (card.last[key] === value) return;
      card.last[key] = value;
      element.style[property] = value;
    }

    function along(position) {
      return 'calc(' + position + ' * (100% - 28px) + 6px)';
    }

    function drawCard(card) {
      var view = card.demo.view(c, color, +card.slider.value);
      var texts = slots(view);
      var parts = card.parts;
      var key;
      card.stale = false;

      switch (card.demo.stage) {
        case 'text':
          place(card, 'a', card.stage, 'background', view.a);
          place(card, 'b', card.stage, 'color', view.b);
          break;
        case 'meter':
          place(card, 'g', card.stage, 'backgroundImage', view.g);
          place(card, 'q', parts[0], 'left', along(view.q));
          place(card, 'p', parts[1], 'left', along(view.p));
          place(card, 'b', parts[1], 'background', view.b);
          break;
        case 'bars':
          view.bars.forEach(function (bar, i) {
            place(card, 'w' + i, parts[i], 'width', +(bar * 100).toFixed(1) + '%');
            place(card, 'a' + i, parts[i], 'background', view.a);
          });
          break;
        default:
          place(card, 'a', parts[0], 'background', view.a);
          place(card, 'b', parts[1], 'background', view.b);
          if (parts[2]) place(card, 'c', parts[2], 'background', view.c);
      }

      for (key in texts) setText(card.slots[key], texts[key]);
    }

    filters.addEventListener('click', function (event) {
      var group = event.target.getAttribute('data-filter');
      if (group === null) return;
      filters.querySelectorAll('[data-filter]').forEach(function (button) {
        button.setAttribute('aria-pressed', String(button === event.target));
      });
      cards.forEach(function (card) {
        card.element.hidden = group !== '' && card.element.getAttribute('data-group') !== group;
      });
    });

    // ---- the rest ----------------------------------------------------------
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
    setPlaying(playing);
  }

  return {
    fieldRows: fieldRows,
    fieldSvg: fieldSvg,
    galleryHtml: galleryHtml,
    heroChip: heroChip,
    padColor: padColor,
    themeRatios: themeRatios,
    tokenStyle: tokenStyle,
    start: start,
  };
})();

if (typeof module !== 'undefined') module.exports = showcase;
