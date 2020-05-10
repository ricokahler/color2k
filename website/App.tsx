import * as React from 'react';
import { useState } from 'react';

// steps:
// - 1 add postcss
// - 2 extract out docs with a palette example format?
// - 3 feed those into docs prop

function App({}) {
  const [clicks, setClicks] = useState(0);

  return (
    <div id="root">
      <h1>test</h1>
      <button onClick={() => setClicks(clicks + 1)}>{clicks}</button>
    </div>
  );
}

export default App;
