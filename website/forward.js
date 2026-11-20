// Runs on the pages left at old addresses such as `/adjust/`. It sends the
// visitor to the same place on the one page, keeping the anchor they asked
// for: `/adjust/#darken` goes to `/#darken`, and `/adjust/` to `/#adjust`.
(function () {
  var section = document.documentElement.getAttribute('data-to');
  location.replace('/' + (location.hash.length > 1 ? location.hash : '#' + section));
})();
