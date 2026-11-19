// Runs before the page paints, so a stored Light or Dark choice and a stored
// color never flash the defaults first. Everything else is in `client.js`.
(function () {
  var root = document.documentElement;
  root.classList.add('js');
  try {
    var mode = localStorage.getItem('color2k:mode');
    if (mode === 'light' || mode === 'dark') root.setAttribute('data-theme', mode);
    var vars = JSON.parse(localStorage.getItem('color2k:vars') || 'null');
    if (vars) {
      var dark =
        mode === 'dark' ||
        (mode !== 'light' && matchMedia('(prefers-color-scheme: dark)').matches);
      root.style.cssText = vars[dark ? 'dark' : 'light'];
      // The theme samples have their own colors, kept as CSS rules.
      var samples = vars[dark ? 'darkSamples' : 'lightSamples'];
      if (samples) {
        var style = document.createElement('style');
        style.textContent = samples;
        document.head.appendChild(style);
      }
    }
  } catch (error) {
    // No storage (private mode, blocked cookies). The defaults are fine.
  }
})();
