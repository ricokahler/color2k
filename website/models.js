// What every demo on the site shows, as plain data.
//
// Each model takes the visitor's color and the demo's own settings and returns
// CSS variables (`vars`), text (`text`) and on/off flags (`flags`). The build
// calls these to render the first paint, and the browser calls the same
// functions when the color changes, so the two cannot disagree.
//
// This file runs in Node and, concatenated into `site.js`, in the browser.
var c2kModels = function (c, builders) {
  var PRESETS = [
    { name: 'Pink', color: '#ff2d6f' },
    { name: 'Tangerine', color: '#ff9500' },
    { name: 'Sun', color: '#ffe100' },
    { name: 'Teal', color: '#00dcc0' },
    { name: 'Violet', color: '#6a5cff' },
    { name: 'Indigo', color: '#4a35e8' },
    { name: 'Glass', color: 'rgba(74, 53, 232, 0.5)' },
  ];
  // The page opens on Indigo. It is solid and not fully saturated, so every
  // demo has room to move it.
  var DEFAULT = PRESETS[5].color;

  var quote = function (value) {
    return "'" + value + "'";
  };
  var fmt = function (value, places) {
    var scale = Math.pow(10, places === undefined ? 2 : places);
    return String(Math.round(value * scale) / scale);
  };
  /** A see-through color the way it looks on a background. */
  var solid = function (color, background) {
    return c.toHex(
      c.mix(background, c.toHex(color).slice(0, 7), c.parseToRgba(color)[3])
    );
  };
  var tryParse = function (value) {
    try {
      return c.parseToRgba(value);
    } catch (error) {
      return null;
    }
  };
  /**
   * Whether the site can be painted from this string. The parser lets a
   * malformed alpha such as `rgba(255, 0, 0, .)` through as `NaN`, and a
   * color like that cannot be mixed or measured.
   */
  var usable = function (value) {
    var parsed = tryParse(value);
    if (!parsed || !parsed.every(isFinite)) return false;
    try {
      site(value, false);
      return true;
    } catch (error) {
      return false;
    }
  };

  // ------------------------------------------------------------------ site

  /**
   * The site's own theme, built from the visitor's color. Fourteen tokens for
   * light or dark. `scripts/check-website.js` sweeps this through about 1,300
   * colors and fails if a text pair drops below WCAG AA.
   */
  function site(color, dark) {
    var accent = solid(color, dark ? '#000' : '#fff');
    var parsed = c.parseToHsla(accent);
    var hue = parsed[0];
    var chroma = parsed[1];
    var tone = function (lightness, scale) {
      return c.toHex(c.hsla(hue, chroma * scale, lightness, 1));
    };
    var bg = dark ? tone(0.085, 0.2) : tone(0.975, 0.5);
    var surface = dark ? tone(0.125, 0.18) : '#ffffff';
    var sunken = dark ? tone(0.06, 0.22) : tone(0.945, 0.4);
    var text = dark ? tone(0.94, 0.25) : tone(0.12, 0.35);
    // Links and focus rings are set in the color, so it has to read on the
    // page. Step it toward the text color until it does.
    var hardest = dark ? surface : sunken;
    var ink = accent;
    for (var i = 0; i < 60 && c.hasBadContrast(ink, 'aa', hardest); i++) {
      ink = c.toHex(dark ? c.lighten(ink, 0.02) : c.darken(ink, 0.02));
    }
    var onAccent = c.readableColor(accent);

    return {
      bg: bg,
      surface: surface,
      sunken: sunken,
      line: dark ? tone(0.24, 0.16) : tone(0.86, 0.3),
      edge: dark ? tone(0.82, 0.2) : tone(0.12, 0.35),
      text: text,
      muted: dark ? tone(0.72, 0.14) : tone(0.36, 0.2),
      accent: accent,
      onAccent: onAccent,
      // Hover moves away from the label, so the label only gets easier to read.
      accentHover: c.toHex(c.mix(accent, c.readableColor(onAccent), 0.14)),
      ink: ink,
      soft: c.toHex(c.mix(accent, bg, dark ? 0.8 : 0.86)),
      // The hard shadow under a lifted card. A color too close to the page
      // would not show, so it falls back to the text color.
      shadow: c.hasBadContrast(accent, 'decorative', bg) ? text : accent,
      checker: dark ? tone(0.2, 0.1) : tone(0.88, 0.2),
    };
  }

  /** The text pairs in `site` that have to hold AA. */
  var SITE_PAIRS = [
    ['text', 'bg'],
    ['text', 'surface'],
    ['text', 'sunken'],
    ['text', 'soft'],
    ['muted', 'bg'],
    ['muted', 'surface'],
    ['muted', 'sunken'],
    ['ink', 'bg'],
    ['ink', 'surface'],
    ['ink', 'sunken'],
    ['onAccent', 'accent'],
    ['onAccent', 'accentHover'],
  ];

  var kebab = function (name) {
    return name.replace(/[A-Z]/g, function (letter) {
      return '-' + letter.toLowerCase();
    });
  };

  /** `{ accentHover: '#fff' }` as `{ '--accent-hover': '#fff' }`. */
  function tokenVars(tokens, prefix) {
    var vars = {};
    Object.keys(tokens).forEach(function (name) {
      if (typeof tokens[name] === 'string') {
        vars['--' + (prefix || '') + kebab(name)] = tokens[name];
      }
    });
    return vars;
  }

  // ----------------------------------------------------------------- demos

  // A swatch: its color, and the black or white that reads on it.
  function swatch(vars, key, color, ctx) {
    vars['--' + key] = color;
    vars['--' + key + '-on'] = c.readableColor(solid(color, ctx.bg));
  }

  var STEPS = [0, 0.05, 0.1, 0.15, 0.2, 0.25, 0.3, 0.35, 0.4, 0.45, 0.5];

  // darken, lighten, saturate and desaturate share one demo: a ramp of steps
  // and the step you chose.
  function ramp(name, stuck) {
    return function (color, p, ctx) {
      var vars = {};
      var out = c[name](color, p.amount);
      STEPS.forEach(function (amount, index) {
        swatch(vars, 'c' + index, c[name](color, amount), ctx);
      });
      swatch(vars, 'from', color, ctx);
      swatch(vars, 'res', out, ctx);
      vars['--at'] = fmt(p.amount / 0.5, 4);
      return {
        vars: vars,
        text: {
          code: name + '(' + quote(color) + ', ' + fmt(p.amount) + ')',
          out: quote(out),
          amount: fmt(p.amount),
        },
        flags: { stuck: stuck(c.parseToHsla(color)) },
      };
    };
  }

  // opacify and transparentize: a ramp of alpha steps over a checkerboard.
  function alphaRamp(name, stuck, start) {
    return function (picked, p, ctx) {
      var vars = {};
      var color = start ? start(picked) : picked;
      var out = c[name](color, p.amount);
      STEPS.forEach(function (amount, index) {
        swatch(vars, 'c' + index, c[name](color, amount * 2), ctx);
      });
      swatch(vars, 'from', color, ctx);
      swatch(vars, 'res', out, ctx);
      vars['--at'] = fmt(p.amount, 4);
      return {
        vars: vars,
        text: {
          code: name + '(' + quote(color) + ', ' + fmt(p.amount) + ')',
          out: quote(out),
          amount: fmt(p.amount),
          alpha: fmt(c.parseToRgba(color)[3]),
        },
        flags: { stuck: stuck(c.parseToRgba(color)[3]), faded: color !== picked },
      };
    };
  }

  function spelling(name) {
    return function (color, p, ctx) {
      var vars = {};
      var out = c[name](color);
      swatch(vars, 'res', out, ctx);
      return {
        vars: vars,
        text: { code: name + '(' + quote(color) + ')', out: quote(out) },
      };
    };
  }

  // The colors a second color can be picked from in `mix` and the contrast
  // demos. `complement` is worked out from the visitor's color.
  function other(color, key) {
    if (key === 'complement') return c.toHex(c.adjustHue(c.toHex(color).slice(0, 7), 180));
    return key;
  }

  var SCALES = {
    rainbow: function (color) {
      var base = c.toHex(color);
      return [base].concat(
        [60, 120, 180, 240, 300].map(function (degrees) {
          return c.toHex(c.adjustHue(base, degrees));
        }),
        [base]
      );
    },
    tints: function (color) {
      return ['#ffffff', c.toHex(color), '#000000'];
    },
    sunset: function () {
      return ['#2b1a6b', '#b5179e', '#ff2d6f', '#ff9500', '#ffe100'];
    },
    lagoon: function () {
      return ['#0b1d51', '#4a35e8', '#00dcc0', '#e6fff9'];
    },
    pair: function (color) {
      return [c.toHex(color), other(color, 'complement')];
    },
  };

  // Text on a ramp of the color, from nearly white to nearly black.
  var LIGHTNESS = [0.95, 0.85, 0.75, 0.65, 0.55, 0.45, 0.35, 0.25, 0.15, 0.06];
  function lightnessRamp(color) {
    var parsed = c.parseToHsla(solid(color, '#fff'));
    return LIGHTNESS.map(function (lightness) {
      return c.toHex(c.hsla(parsed[0], parsed[1], lightness, 1));
    });
  }

  var STANDARDS = ['decorative', 'readable', 'aa', 'aaa'];

  var demos = {
    parseToRgba: function (color) {
      var rgba = c.parseToRgba(color);
      return {
        vars: {
          '--r': fmt(rgba[0] / 255, 4),
          '--g': fmt(rgba[1] / 255, 4),
          '--b': fmt(rgba[2] / 255, 4),
          '--a': fmt(rgba[3], 4),
          '--res': color,
        },
        text: {
          code: 'parseToRgba(' + quote(color) + ')',
          out: '[' + rgba.join(', ') + ']',
          r: fmt(rgba[0]),
          g: fmt(rgba[1]),
          b: fmt(rgba[2]),
          a: fmt(rgba[3]),
        },
      };
    },

    parseToHsla: function (color) {
      var hsla = c.parseToHsla(color);
      return {
        vars: {
          '--h': fmt(hsla[0], 2),
          '--s': fmt(hsla[1], 4),
          '--l': fmt(hsla[2], 4),
          '--a': fmt(hsla[3], 4),
          '--res': color,
          '--pure': c.hsla(hsla[0], 1, 0.5, 1),
        },
        text: {
          code: 'parseToHsla(' + quote(color) + ')',
          out: '[' + hsla.join(', ') + ']',
          h: fmt(hsla[0], 0) + '°',
          s: fmt(hsla[1] * 100, 0) + '%',
          l: fmt(hsla[2] * 100, 0) + '%',
          a: fmt(hsla[3]),
        },
      };
    },

    toHex: spelling('toHex'),
    toRgba: spelling('toRgba'),
    toHsla: spelling('toHsla'),

    rgba: function (color, p, ctx) {
      var vars = {};
      var out = c.rgba(p.red, p.green, p.blue, p.alpha);
      swatch(vars, 'res', out, ctx);
      vars['--t-red'] =
        'linear-gradient(90deg,' + c.rgba(0, p.green, p.blue, 1) + ',' + c.rgba(255, p.green, p.blue, 1) + ')';
      vars['--t-green'] =
        'linear-gradient(90deg,' + c.rgba(p.red, 0, p.blue, 1) + ',' + c.rgba(p.red, 255, p.blue, 1) + ')';
      vars['--t-blue'] =
        'linear-gradient(90deg,' + c.rgba(p.red, p.green, 0, 1) + ',' + c.rgba(p.red, p.green, 255, 1) + ')';
      vars['--t-alpha'] =
        'linear-gradient(90deg,' + c.rgba(p.red, p.green, p.blue, 0) + ',' + c.rgba(p.red, p.green, p.blue, 1) + ')';
      return {
        vars: vars,
        text: {
          code: 'rgba(' + [p.red, p.green, p.blue, fmt(p.alpha)].join(', ') + ')',
          out: quote(out),
          red: String(p.red),
          green: String(p.green),
          blue: String(p.blue),
          alpha: fmt(p.alpha),
        },
        use: out,
      };
    },

    hsla: function (color, p, ctx) {
      var vars = {};
      var out = c.hsla(p.hue, p.saturation, p.lightness, p.alpha);
      var at = function (hue, saturation, lightness, alpha) {
        return c.hsla(hue, saturation, lightness, alpha);
      };
      swatch(vars, 'res', out, ctx);
      vars['--t-hue'] =
        'linear-gradient(90deg,' +
        [0, 60, 120, 180, 240, 300, 359.9]
          .map(function (hue) {
            return at(hue, p.saturation, p.lightness, 1);
          })
          .join(',') +
        ')';
      vars['--t-saturation'] =
        'linear-gradient(90deg,' + at(p.hue, 0, p.lightness, 1) + ',' + at(p.hue, 1, p.lightness, 1) + ')';
      vars['--t-lightness'] =
        'linear-gradient(90deg,' + at(p.hue, p.saturation, 0, 1) + ',' + at(p.hue, p.saturation, 0.5, 1) + ',' + at(p.hue, p.saturation, 1, 1) + ')';
      vars['--t-alpha'] =
        'linear-gradient(90deg,' + at(p.hue, p.saturation, p.lightness, 0) + ',' + at(p.hue, p.saturation, p.lightness, 1) + ')';
      return {
        vars: vars,
        text: {
          code: 'hsla(' + [p.hue, fmt(p.saturation), fmt(p.lightness), fmt(p.alpha)].join(', ') + ')',
          out: quote(out),
          hue: String(p.hue),
          saturation: fmt(p.saturation),
          lightness: fmt(p.lightness),
          alpha: fmt(p.alpha),
        },
        use: out,
      };
    },

    darken: ramp('darken', function (hsla) {
      return hsla[2] <= 0.02;
    }),
    lighten: ramp('lighten', function (hsla) {
      return hsla[2] >= 0.98;
    }),
    saturate: ramp('saturate', function (hsla) {
      return hsla[1] >= 0.98 || hsla[2] <= 0.02 || hsla[2] >= 0.98;
    }),
    desaturate: ramp('desaturate', function (hsla) {
      return hsla[1] <= 0.02;
    }),

    adjustHue: function (color, p, ctx) {
      var vars = {};
      var out = c.adjustHue(color, p.degrees);
      for (var index = 0; index < 24; index++) {
        vars['--w' + index] = c.adjustHue(color, index * 15);
      }
      swatch(vars, 'from', color, ctx);
      swatch(vars, 'res', out, ctx);
      vars['--deg'] = String(p.degrees);
      return {
        vars: vars,
        text: {
          code: 'adjustHue(' + quote(color) + ', ' + p.degrees + ')',
          out: quote(out),
          degrees: p.degrees + '°',
        },
        flags: { stuck: c.parseToHsla(color)[1] <= 0.02 },
      };
    },

    // A solid color has no alpha to add, so the demo fades it first.
    opacify: alphaRamp(
      'opacify',
      function () {
        return false;
      },
      function (color) {
        return c.parseToRgba(color)[3] >= 1 ? c.transparentize(color, 0.6) : color;
      }
    ),
    transparentize: alphaRamp('transparentize', function (alpha) {
      return alpha <= 0;
    }),

    mix: function (color, p, ctx) {
      var vars = {};
      var second = other(color, p.other);
      var out = c.mix(color, second, p.weight);
      var stops = [];
      for (var index = 0; index <= 10; index++) {
        stops.push(c.mix(color, second, index / 10));
      }
      swatch(vars, 'from', color, ctx);
      swatch(vars, 'to', second, ctx);
      swatch(vars, 'res', out, ctx);
      vars['--blend'] = 'linear-gradient(90deg,' + stops.join(',') + ')';
      vars['--at'] = fmt(p.weight, 4);
      return {
        vars: vars,
        text: {
          code: 'mix(' + quote(color) + ', ' + quote(second) + ', ' + fmt(p.weight) + ')',
          out: quote(out),
          weight: fmt(p.weight),
          to: second,
        },
      };
    },

    getScale: function (color, p, ctx) {
      var vars = {};
      var stops = SCALES[p.set](color);
      var scale = c.getScale.apply(null, stops);
      var smooth = [];
      var hard = [];
      var steps = [];
      for (var index = 0; index <= 48; index++) smooth.push(scale(index / 48));
      for (var step = 0; step < p.steps; step++) {
        var value = scale(p.steps === 1 ? 0 : step / (p.steps - 1));
        steps.push(value);
        hard.push(
          value + ' ' + fmt((step / p.steps) * 100) + '% ' + fmt(((step + 1) / p.steps) * 100) + '%'
        );
      }
      var out = scale(p.at);
      swatch(vars, 'res', out, ctx);
      vars['--ribbon'] = 'linear-gradient(90deg,' + smooth.join(',') + ')';
      vars['--steps'] = 'linear-gradient(90deg,' + hard.join(',') + ')';
      vars['--at'] = fmt(p.at, 4);
      return {
        vars: vars,
        text: {
          make: 'const scale = getScale(' + stops.map(quote).join(', ') + ')',
          code: 'scale(' + fmt(p.at) + ')',
          out: quote(out),
          steps: String(p.steps),
        },
        steps: steps,
      };
    },

    getContrast: function (color, p, ctx) {
      var vars = {};
      var second = other(color, p.other);
      var out = c.getContrast(color, second);
      vars['--fg'] = c.toHex(color).slice(0, 7);
      vars['--bg2'] = second;
      // 1 to 21 on a log scale, so 4.5 is not crushed against the left edge.
      vars['--at'] = fmt(Math.log(out) / Math.log(21), 4);
      return {
        vars: vars,
        text: {
          code: 'getContrast(' + quote(color) + ', ' + quote(second) + ')',
          out: String(out),
          ratio: fmt(out) + ':1',
          grade: out >= 7 ? 'Passes AAA' : out >= 4.5 ? 'Passes AA' : out >= 3 ? 'Large text only' : 'Fails AA',
        },
        flags: { alpha: c.parseToRgba(color)[3] < 1 },
      };
    },

    getLuminance: function (color, p, ctx) {
      var vars = {};
      var out = c.getLuminance(color);
      swatch(vars, 'res', c.toHex(color).slice(0, 7), ctx);
      vars['--at'] = fmt(out, 4);
      return {
        vars: vars,
        text: { code: 'getLuminance(' + quote(color) + ')', out: String(out), short: fmt(out, 3) },
        flags: { alpha: c.parseToRgba(color)[3] < 1 },
      };
    },

    hasBadContrast: function (color, p, ctx) {
      var vars = {};
      var text = {};
      var flags = { alpha: c.parseToRgba(color)[3] < 1 };
      var second = other(color, p.other);
      vars['--fg'] = c.toHex(color).slice(0, 7);
      vars['--bg2'] = second;
      STANDARDS.forEach(function (standard) {
        var bad = c.hasBadContrast(color, standard, second);
        text[standard] = String(bad);
        flags[standard] = bad;
      });
      text.code = 'hasBadContrast(' + quote(color) + ", 'aa', " + quote(second) + ')';
      text.out = text.aa;
      text.ratio = fmt(c.getContrast(color, second)) + ':1';
      return { vars: vars, text: text, flags: flags };
    },

    readableColor: function (color, p, ctx) {
      var vars = {};
      var out = c.readableColor(color);
      lightnessRamp(color).forEach(function (step, index) {
        vars['--c' + index] = step;
        vars['--c' + index + '-on'] = c.readableColor(step);
      });
      vars['--res'] = c.toHex(color).slice(0, 7);
      vars['--res-on'] = out;
      return {
        vars: vars,
        text: { code: 'readableColor(' + quote(color) + ')', out: quote(out) },
        flags: { alpha: c.parseToRgba(color)[3] < 1 },
      };
    },

    readableColorIsBlack: function (color, p, ctx) {
      var vars = {};
      var text = {};
      var out = c.readableColorIsBlack(color);
      lightnessRamp(color).forEach(function (step, index) {
        var black = c.readableColorIsBlack(step);
        vars['--c' + index] = step;
        vars['--c' + index + '-on'] = black ? '#000' : '#fff';
        text['t' + index] = String(black);
      });
      vars['--res'] = c.toHex(color).slice(0, 7);
      vars['--res-on'] = out ? '#000' : '#fff';
      text.code = 'readableColorIsBlack(' + quote(color) + ')';
      text.out = String(out);
      return { vars: vars, text: text, flags: { alpha: c.parseToRgba(color)[3] < 1 } };
    },

    guard: function (color, p) {
      var out = c.guard(0, 1, p.value);
      // The rail runs from -0.5 to 1.5.
      return {
        vars: { '--raw': fmt((p.value + 0.5) / 2, 4), '--at': fmt((out + 0.5) / 2, 4) },
        text: {
          code: 'guard(0, 1, ' + fmt(p.value) + ')',
          out: String(out),
          value: fmt(p.value),
        },
        flags: { clamped: out !== p.value },
      };
    },

    ColorError: function (color, p) {
      var parsed = tryParse(p.input);
      var message = '';
      if (!parsed) {
        try {
          c.parseToRgba(p.input);
        } catch (error) {
          message = error.message;
        }
      }
      return {
        vars: { '--res': parsed ? p.input : 'transparent' },
        text: {
          code: 'parseToRgba(' + quote(p.input) + ')',
          out: parsed ? '[' + parsed.join(', ') + ']' : 'ColorError: ' + message,
          verdict: parsed ? 'That one parses, so nothing is thrown.' : 'Thrown, and caught by the try.',
        },
        flags: { thrown: !parsed },
      };
    },
  };

  /** Where a demo's settings start. Some start from the visitor's color. */
  var initial = {
    rgba: function (color) {
      var rgba = c.parseToRgba(color);
      return { red: rgba[0], green: rgba[1], blue: rgba[2], alpha: Math.round(rgba[3] * 100) / 100 };
    },
    hsla: function (color) {
      var hsla = c.parseToHsla(color);
      return {
        hue: Math.round(hsla[0]) % 360,
        saturation: Math.round(hsla[1] * 100) / 100,
        lightness: Math.round(hsla[2] * 100) / 100,
        alpha: Math.round(hsla[3] * 100) / 100,
      };
    },
    darken: { amount: 0.15 },
    lighten: { amount: 0.15 },
    saturate: { amount: 0.2 },
    desaturate: { amount: 0.3 },
    adjustHue: { degrees: 120 },
    opacify: { amount: 0.3 },
    transparentize: { amount: 0.4 },
    mix: { other: '#ff2d6f', weight: 0.5 },
    getScale: { set: 'rainbow', steps: 9, at: 0.5 },
    getContrast: { other: '#ffffff' },
    hasBadContrast: { other: '#ffffff' },
    guard: { value: 1.3 },
    ColorError: { input: 'not-a-color' },
  };

  function start(name, color) {
    var value = initial[name];
    return typeof value === 'function' ? value(color) : Object.assign({}, value || {});
  }

  // ------------------------------------------------------------- overview

  /** The small pictures on the six group cards of the overview. */
  function overview(color, p, ctx) {
    var vars = {};
    var rgba = c.parseToRgba(color);
    var base = c.toHex(color);
    var tints = [0.3, 0.2, 0.1, 0, -0.1, -0.2, -0.3];
    tints.forEach(function (amount, index) {
      vars['--a' + index] = c.lighten(color, amount);
    });
    lightnessRamp(color)
      .filter(function (step, index) {
        return index % 2 === 0;
      })
      .forEach(function (step, index) {
        vars['--k' + index] = step;
        vars['--k' + index + '-on'] = c.readableColor(step);
      });
    var scale = c.getScale.apply(null, SCALES.rainbow(color));
    var smooth = [];
    for (var index = 0; index <= 24; index++) smooth.push(scale(index / 24));
    vars['--ribbon'] = 'linear-gradient(90deg,' + smooth.join(',') + ')';
    vars['--r'] = fmt(rgba[0] / 255, 4);
    vars['--g'] = fmt(rgba[1] / 255, 4);
    vars['--b'] = fmt(rgba[2] / 255, 4);
    vars['--a'] = fmt(rgba[3], 4);
    vars['--res'] = color;
    return {
      vars: vars,
      text: {
        tuple: '[' + rgba.map(function (value) { return fmt(value); }).join(', ') + ']',
        hex: base,
        rgb: c.toRgba(color),
        hsl: c.toHsla(color),
      },
    };
  }

  // ---------------------------------------------------------------- wheel

  var WEDGES = 24;
  var RINGS = [0, 0.13, 0.26, 0.39];

  /**
   * The splash wheel. Wedge 0 is the color with its hue set to 0, and each
   * wedge after it is `adjustHue` 15 degrees further round. Each ring inward
   * is `lighten` by another step. Turning the wheel only changes the hue, so
   * the fills depend on saturation, lightness and alpha alone.
   */
  function wheel(saturation, lightness, alpha) {
    var vars = {};
    var base = c.hsla(0, saturation, lightness, alpha);
    for (var wedge = 0; wedge < WEDGES; wedge++) {
      var turned = c.adjustHue(base, wedge * (360 / WEDGES));
      RINGS.forEach(function (amount, ring) {
        vars['--w' + ring + '-' + wedge] = amount ? c.lighten(turned, amount) : turned;
      });
    }
    return vars;
  }

  // --------------------------------------------------------------- themes

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

  var TOKENS = [
    'bg', 'surface', 'border', 'text', 'muted', 'onSurface', 'accent',
    'accentHover', 'onAccent', 'soft', 'onSoft', 'ring', 'extra', 'shadow',
  ];

  /** One theme, built from the color for the mode the site is in. */
  function theme(key) {
    return function (color, p, ctx) {
      var tokens = builders[key](color, ctx.dark);
      var vars = tokenVars(tokens, 't-');
      var text = {
        code: key + 'Theme(' + quote(color) + (ctx.dark ? ', true' : '') + ')',
        textRatio: fmt(c.getContrast(tokens.text, tokens.bg), 1) + ':1',
        buttonRatio: fmt(c.getContrast(tokens.onAccent, tokens.accent), 1) + ':1',
        chipRatio: fmt(c.getContrast(tokens.onSoft, tokens.soft), 1) + ':1',
      };
      TOKENS.forEach(function (name) {
        text[name] = tokens[name];
        vars['--t-' + kebab(name) + '-on'] = c.readableColor(solid(tokens[name], tokens.bg));
      });
      WHY[key].forEach(function (row, index) {
        var says = row.says[row.pick(tokens.why)];
        text['why' + index] = says[0] + ', so ' + says[1] + '.';
      });
      return { vars: vars, text: text };
    };
  }

  if (builders) {
    Object.keys(WHY).forEach(function (key) {
      demos['theme-' + key] = theme(key);
    });
  }
  demos.overview = overview;

  return {
    DEFAULT: DEFAULT,
    LIGHTNESS: LIGHTNESS,
    PRESETS: PRESETS,
    RINGS: RINGS,
    SCALES: SCALES,
    SITE_PAIRS: SITE_PAIRS,
    STANDARDS: STANDARDS,
    STEPS: STEPS,
    TOKENS: TOKENS,
    WEDGES: WEDGES,
    WHY: WHY,
    demos: demos,
    fmt: fmt,
    /** Whether a demo's settings start over when the color changes. */
    follows: function (name) {
      return typeof initial[name] === 'function';
    },
    kebab: kebab,
    other: other,
    site: site,
    solid: solid,
    start: start,
    tokenVars: tokenVars,
    tryParse: tryParse,
    usable: usable,
    /**
     * The theme samples' colors as CSS rules. `root` is put in front of each
     * selector, to scope the rules to a color mode or to outrank them.
     */
    sampleCss: function (color, dark, root) {
      return Object.keys(WHY)
        .map(function (key) {
          var vars = demos['theme-' + key](color, {}, { bg: '#ffffff', dark: dark }).vars;
          return (
            root +
            '[data-demo="theme-' + key + '"]{' +
            Object.keys(vars)
              .map(function (name) {
                return name + ':' + vars[name];
              })
              .join(';') +
            '}'
          );
        })
        .join('');
    },
    wheel: wheel,
  };
};

if (typeof module !== 'undefined') module.exports = c2kModels;
