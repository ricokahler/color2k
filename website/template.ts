function template(reactHtml: string, reactCode: string, css: string) {
  return `<html>
    <head>
      <title>test</title>
      <script crossorigin src="https://unpkg.com/react@16/umd/react.production.min.js"></script>
      <script crossorigin src="https://unpkg.com/react-dom@16/umd/react-dom.production.min.js"></script>
      <style>${css}</style>
    </head>
    <body>
      ${reactHtml}
      <script>${reactCode}</script>
      <script>
        ReactDOM.hydrate(React.createElement(App, null, []), document.querySelector('#root'));
      </script>
    </body>
  </html>`;
}

export default template;
