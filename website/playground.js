// Renders the playground on the home page. The website build calls this with
// the library to produce the static HTML, and the page inlines the same
// function to re-render when the visitor picks another color. Keep it plain
// ES5-style browser JavaScript with no imports.
function playground(c, color) {
  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // Throws a ColorError for invalid input before anything is rendered.
  var hex = c.toHex(color);
  var name = "'" + escapeHtml(color.trim()) + "'";

  function tile(code, value) {
    return (
      '<li class="play-tile">' +
      '<span class="play-swatch"><span style="background:' +
      escapeHtml(value) +
      '"></span></span>' +
      '<code class="play-code">' +
      code +
      '</code>' +
      '<code class="play-value">' +
      escapeHtml(value) +
      '</code>' +
      '</li>'
    );
  }

  var tiles = [
    tile('darken(' + name + ', 0.1)', c.darken(color, 0.1)),
    tile('lighten(' + name + ', 0.1)', c.lighten(color, 0.1)),
    tile('desaturate(' + name + ', 0.3)', c.desaturate(color, 0.3)),
    tile('adjustHue(' + name + ', 180)', c.adjustHue(color, 180)),
    tile('transparentize(' + name + ', 0.5)', c.transparentize(color, 0.5)),
    tile('mix(' + name + ", 'gold', 0.5)", c.mix(color, 'gold', 0.5)),
  ].join('');

  var scale = c.getScale('white', color, 'black');
  var steps = '';
  for (var i = 1; i <= 9; i++) {
    var step = c.toHex(scale(i / 10));
    steps +=
      '<li style="background:' +
      step +
      ';color:' +
      c.readableColor(step) +
      '"><span>' +
      step +
      '</span></li>';
  }

  var readable = c.readableColor(color);
  var contrast = c.getContrast(color, readable);

  function badge(standard) {
    var bad = c.hasBadContrast(readable, standard, color);
    return (
      '<span class="play-badge" data-pass="' +
      !bad +
      '">' +
      standard.toUpperCase() +
      (bad ? ' fails' : ' passes') +
      '</span>'
    );
  }

  return (
    '<p class="play-formats"><code>' +
    escapeHtml(hex) +
    '</code><code>' +
    escapeHtml(c.toRgba(color)) +
    '</code><code>' +
    escapeHtml(c.toHsla(color)) +
    '</code></p>' +
    '<ul class="play-tiles">' +
    tiles +
    '</ul>' +
    '<div class="play-row">' +
    '<div class="play-panel">' +
    "<code class=\"play-code\">getScale('white', " +
    name +
    ", 'black')</code>" +
    '<ol class="play-scale">' +
    steps +
    '</ol>' +
    '</div>' +
    '<div class="play-panel">' +
    '<code class="play-code">readableColor(' +
    name +
    ')</code>' +
    '<div class="play-readable" style="background:' +
    escapeHtml(hex) +
    ';color:' +
    readable +
    '">' +
    '<strong>Readable text</strong>' +
    '<span>' +
    readable +
    ' at ' +
    contrast.toFixed(2) +
    ':1</span>' +
    '</div>' +
    '<p class="play-badges">' +
    badge('aa') +
    badge('aaa') +
    '</p>' +
    '</div>' +
    '</div>'
  );
}

if (typeof module !== 'undefined') module.exports = playground;
