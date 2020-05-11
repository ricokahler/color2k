import * as React from 'react';
import { useState } from 'react';
import { DocInfo } from './getDocInfo';

interface Props {
  docs: DocInfo[];
  readmeHtml: string;
}

function App({ docs, readmeHtml }: Props) {
  const [value, setValue] = useState('');

  const filtered = docs.filter(({ functionName }) =>
    functionName.toLowerCase().trim().includes(value.trim().toLowerCase())
  );

  return (
    <div className="root" id="root">
      <header className="header">
        <div className="header-content">
          <a className="logo" href="/">
            <h1>color2k</h1>
          </a>
          <label className="search-label" htmlFor="search">Search</label>
          <input
            id="search"
            autoFocus
            className="search"
            value={value}
            placeholder="type to search…"
            onChange={(e) => {
              setValue(e.currentTarget.value);
              const apiDocsStartEl = document.querySelector('.api-docs-start');
              if (!apiDocsStartEl) return;

              apiDocsStartEl.scrollIntoView();
            }}
          />
          <a
            className="github-link"
            href="https://github.com/ricokahler/color2k"
            title="Contribute on Github"
          >
            <svg
              aria-hidden="true"
              role="img"
              viewBox="0 0 496 512"
              width={32}
              height={32}
            >
              <path
                fill="currentColor"
                d="M165.9 397.4c0 2-2.3 3.6-5.2 3.6-3.3.3-5.6-1.3-5.6-3.6 0-2 2.3-3.6 5.2-3.6 3-.3 5.6 1.3 5.6 3.6zm-31.1-4.5c-.7 2 1.3 4.3 4.3 4.9 2.6 1 5.6 0 6.2-2s-1.3-4.3-4.3-5.2c-2.6-.7-5.5.3-6.2 2.3zm44.2-1.7c-2.9.7-4.9 2.6-4.6 4.9.3 2 2.9 3.3 5.9 2.6 2.9-.7 4.9-2.6 4.6-4.6-.3-1.9-3-3.2-5.9-2.9zM244.8 8C106.1 8 0 113.3 0 252c0 110.9 69.8 205.8 169.5 239.2 12.8 2.3 17.3-5.6 17.3-12.1 0-6.2-.3-40.4-.3-61.4 0 0-70 15-84.7-29.8 0 0-11.4-29.1-27.8-36.6 0 0-22.9-15.7 1.6-15.4 0 0 24.9 2 38.6 25.8 21.9 38.6 58.6 27.5 72.9 20.9 2.3-16 8.8-27.1 16-33.7-55.9-6.2-112.3-14.3-112.3-110.5 0-27.5 7.6-41.3 23.6-58.9-2.6-6.5-11.1-33.3 2.6-67.9 20.9-6.5 69 27 69 27 20-5.6 41.5-8.5 62.8-8.5s42.8 2.9 62.8 8.5c0 0 48.1-33.6 69-27 13.7 34.7 5.2 61.4 2.6 67.9 16 17.7 25.8 31.5 25.8 58.9 0 96.5-58.9 104.2-114.8 110.5 9.2 7.9 17 22.9 17 46.4 0 33.7-.3 75.4-.3 83.6 0 6.5 4.6 14.4 17.3 12.1C428.2 457.8 496 362.9 496 252 496 113.3 383.5 8 244.8 8zM97.2 352.9c-1.3 1-1 3.3.7 5.2 1.6 1.6 3.9 2.3 5.2 1 1.3-1 1-3.3-.7-5.2-1.6-1.6-3.9-2.3-5.2-1zm-10.8-8.1c-.7 1.3.3 2.9 2.3 3.9 1.6 1 3.6.7 4.3-.7.7-1.3-.3-2.9-2.3-3.9-2-.6-3.6-.3-4.3.7zm32.4 35.6c-1.6 1.3-1 4.3 1.3 6.2 2.3 2.3 5.2 2.6 6.5 1 1.3-1.3.7-4.3-1.3-6.2-2.2-2.3-5.2-2.6-6.5-1zm-11.4-14.7c-1.6 1-1.6 3.6 0 5.9 1.6 2.3 4.3 3.3 5.6 2.3 1.6-1.3 1.6-3.9 0-6.2-1.4-2.3-4-3.3-5.6-2z"
              />
            </svg>
          </a>
        </div>
      </header>

      <nav className="nav">
        <h2 className="jump-to">Jump to</h2>
        <ul className="list">
          {docs.map(({ functionName, id }) => {
            const index = functionName
              .toLowerCase()
              .trim()
              .indexOf(value.trim().toLowerCase());

            const [first, highlighted, last] = (() => {
              if (index === -1) return [functionName, '', ''];

              return [
                functionName.slice(0, index),
                functionName.slice(index, index + value.length),
                functionName.slice(index + value.length),
              ];
            })();

            return (
              <li key={id}>
                <a className="nav-link" href={`#${id}`}>
                  {first}
                  <strong>{highlighted}</strong>
                  {last}
                </a>
              </li>
            );
          })}
        </ul>
      </nav>

      <main className="main">
        <div
          className="readme"
          dangerouslySetInnerHTML={{ __html: readmeHtml }}
        />
        <div className="api-docs-start" />
        {Boolean(value) && filtered.length > 0 && (
          <div className="card">ℹ Showing filtered results</div>
        )}
        {filtered.length <= 0 ? (
          <div className="empty-state">
            <h3 className="empty-state-text">No results</h3>
          </div>
        ) : (
          filtered.map(
            ({ description, functionName, params, returnType, id }) => (
              <div id={id} className="card" key={id}>
                <h3 className="function-name">
                  <a href={`#${id}`}>
                    <span className="function-identifier">{functionName}</span>(
                    {params.map(({ name }) => name).join(', ')}):{' '}
                    <span className="return-type">{returnType}</span>
                  </a>
                </h3>
                <div dangerouslySetInnerHTML={{ __html: description }} />
                <table className="card-table">
                  <thead>
                    <tr>
                      <th>Param</th>
                      <th>Type</th>
                      <th>
                        {params.some((param) => Boolean(param.description)) && (
                          <>Description</>
                        )}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {params.map(({ name, type, description }) => (
                      <tr key={name}>
                        <td>
                          <code>{name}</code>
                        </td>
                        <td>
                          <code>{type}</code>
                        </td>
                        <td>{description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <small>
                  <a
                    className="go-to-implementation"
                    href={`https://github.com/ricokahler/color2k/blob/master/packages/color2k/src/${functionName}.ts`}
                  >
                    Go to implementation →
                  </a>
                </small>
              </div>
            )
          )
        )}
        <div className="spacer" />
      </main>
    </div>
  );
}

export default App;
