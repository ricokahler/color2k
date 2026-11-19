// The markup for every live demo. Each one is drawn here with the default
// color, using the same models the browser runs (`models.js`), so the page is
// complete before any script loads. `client.js` then fills the same slots
// when the color changes: `data-t` holds text, and the colors are CSS
// variables on the demo's root.

export interface Model {
  vars: { [name: string]: string };
  text: { [key: string]: string };
  flags?: { [key: string]: boolean };
}

interface Context {
  models: any;
  color: string;
}

export function escapeHtml(value: string) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const ctx = { bg: '#ffffff', dark: false };

export function styleOf(vars: { [name: string]: string }) {
  return Object.keys(vars)
    .map((name) => `${name}:${vars[name]}`)
    .join(';');
}

/** A point on a circle, with 0 degrees at the top, going clockwise. */
function point(radius: number, degrees: number) {
  const radians = (degrees * Math.PI) / 180;
  return `${(radius * Math.sin(radians)).toFixed(2)} ${(-radius * Math.cos(radians)).toFixed(2)}`;
}

/** A wedge of a ring, centered on the top. */
export function wedge(inner: number, outer: number, sweep: number) {
  const half = sweep / 2;
  return `M${point(outer, -half)}A${outer} ${outer} 0 0 1 ${point(outer, half)}L${point(
    inner,
    half
  )}A${inner} ${inner} 0 0 0 ${point(inner, -half)}Z`;
}

interface RailOptions {
  param: string;
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  /** A CSS background for the track, or a number of ramp cells (`--c0`...). */
  track: string | number;
  /** The slot that shows the current value. Defaults to `param`. */
  slot?: string;
  checker?: boolean;
  ends?: [string, string];
}

/** A slider whose track is the colors it moves through. */
function rail(text: Model['text'], options: RailOptions) {
  const { param, label, min, max, step, value, track, checker, ends } = options;
  const slot = options.slot || param;
  const cells =
    typeof track === 'number'
      ? `<span class="rail-cells" aria-hidden="true">${Array.from(
          { length: track },
          (_, index) => `<i style="background:var(--c${index})"></i>`
        ).join('')}</span>`
      : `<span class="rail-fill" aria-hidden="true" style="--track:${track}"></span>`;

  return `<label class="rail">
            <span class="rail-name">${label} <b data-t="${slot}">${escapeHtml(text[slot])}</b></span>
            <span class="rail-track${checker ? ' chk' : ''}">
              ${cells}
              <input class="needs-js" type="range" data-param="${param}" min="${min}" max="${max}" step="${step}" value="${value}" />
            </span>${
              ends
                ? `
            <span class="rail-ends" aria-hidden="true"><span>${ends[0]}</span><span>${ends[1]}</span></span>`
                : ''
            }
          </label>`;
}

/** The call as you would write it, and what it returned. */
function call(text: Model['text'], extra = '') {
  return `<div class="call">${extra}
            <code class="call-in" data-t="code">${escapeHtml(text.code)}</code>
            <button type="button" class="call-out" data-copy="out">
              <span class="call-arrow" aria-hidden="true">&rarr;</span>
              <code data-t="out">${escapeHtml(text.out)}</code>
              <span class="call-copy needs-js">Copy</span>
            </button>
          </div>`;
}

/** A swatch you can tap to copy. */
function swatch(key: string, label: string, className = '') {
  return `<button type="button" class="sw ${className}" data-k="${key}" style="--sw:var(--${key});--sw-on:var(--${key}-on)"><span>${label}</span></button>`;
}

interface Choice {
  value: string | number;
  label: string;
  color?: string;
}

/** A row of choices for one of the demo's settings. */
function chips(param: string, label: string, choices: Choice[], current: string | number) {
  return `<div class="chips needs-js" role="group" aria-label="${escapeHtml(label)}">
            <span class="chips-name">${escapeHtml(label)}</span>
            ${choices
              .map(
                ({ value, label: name, color }) =>
                  `<button type="button" class="chip" data-param="${param}" data-value="${escapeHtml(
                    String(value)
                  )}" aria-pressed="${value === current}">${
                    color ? `<i style="background:${escapeHtml(color)}"></i>` : ''
                  }${escapeHtml(name)}</button>`
              )
              .join('\n            ')}
          </div>`;
}

/** A note that only shows when the model raises its flag. */
function hint(flag: string, body: string) {
  return `<p class="hint" data-flag="${flag}">${body}</p>`;
}

const ALPHA_NOTE =
  'This function ignores alpha, so your color is measured as if it were solid.';

const stage = (body: string, className = '') =>
  `<div class="stage ${className}">${body}</div>`;

const fromTo = (name: string) =>
  `<div class="pair">${swatch('from', 'Your color')}${swatch('res', name, 'sw-res')}</div>`;

const OTHERS: Choice[] = [
  { value: '#ffffff', label: 'White', color: '#ffffff' },
  { value: '#000000', label: 'Black', color: '#000000' },
  { value: 'complement', label: 'Complement' },
  { value: '#4a35e8', label: 'Indigo', color: '#4a35e8' },
  { value: '#ffe100', label: 'Sun', color: '#ffe100' },
];

type Body = (model: Model, p: any, context: Context) => string;

const amountRail = (model: Model, p: any, checker = false, max = 0.5) =>
  rail(model.text, {
    param: 'amount',
    label: 'amount',
    min: 0,
    max,
    step: 0.01,
    value: p.amount,
    track: 11,
    checker,
    ends: ['0', String(max)],
  });

const rampBody =
  (name: string, stuck: string): Body =>
  (model, p) =>
    `${stage(`${fromTo(name)}${amountRail(model, p)}`)}
          ${hint('stuck', stuck)}
          ${call(model.text)}`;

const alphaBody =
  (name: string, stuck: string): Body =>
  (model, p) =>
    `${stage(
      `<div class="pair pair-layers">${swatch('from', 'Your color')}${swatch('res', name, 'sw-res')}</div>${amountRail(
        model,
        p,
        true,
        1
      )}`
    )}
          ${hint('stuck', stuck)}
          ${call(model.text)}`;

const spellingBody: Body = (model) =>
  `${stage(
    `<button type="button" class="sw sw-wide" data-k="res" style="--sw:var(--res);--sw-on:var(--res-on)"><span data-t="out">${escapeHtml(
      model.text.out
    )}</span></button>`
  )}
          ${call(model.text)}`;

const lightnessCells = (label: (index: number) => string) =>
  `<div class="flip chk-cut" aria-hidden="true">${Array.from(
    { length: 10 },
    (_, index) =>
      `<span style="background:var(--c${index});color:var(--c${index}-on)">${label(index)}</span>`
  ).join('')}</div>`;

const contrastStage = (model: Model, extra: string) =>
  stage(
    `<div class="sample" style="background:var(--bg2);color:var(--fg)">
              <b>Aa</b>
              <span>Colors that read.</span>
            </div>${extra}`,
    'stage-split'
  );

const bodies: { [name: string]: Body } = {
  parseToRgba: (model) =>
    `${stage(
      `<div class="meters">
              ${[
                ['r', 'Red', 'm-red'],
                ['g', 'Green', 'm-green'],
                ['b', 'Blue', 'm-blue'],
                ['a', 'Alpha', 'm-alpha'],
              ]
                .map(
                  ([key, label, className]) =>
                    `<p class="meter ${className}"><span>${label}</span><i><i style="transform:scaleX(var(--${key}))"></i></i><b data-t="${key}">${escapeHtml(
                      model.text[key]
                    )}</b></p>`
                )
                .join('\n              ')}
            </div>
            <div class="chips needs-js" role="group" aria-label="Try another way to write a color">
              <span class="chips-name">Try another spelling</span>
              ${['rebeccapurple', '#0cf', 'hsl(48, 100%, 50%)', 'rgba(255, 45, 111, 0.5)', 'transparent']
                .map(
                  (value) =>
                    `<button type="button" class="chip" data-pick="${value}"><i class="chk"><i style="background:${value}"></i></i>${value}</button>`
                )
                .join('\n              ')}
            </div>`
    )}
          ${call(model.text)}`,

  parseToHsla: (model) =>
    `${stage(
      `<div class="hsl">
              <div class="dial" aria-hidden="true"><i style="transform:rotate(calc(var(--h) * 1deg))"></i><b data-t="h">${escapeHtml(
                model.text.h
              )}</b></div>
              <div class="meters">
                <p class="meter m-sat"><span>Saturation</span><i><i style="transform:scaleX(var(--s))"></i></i><b data-t="s">${escapeHtml(
                  model.text.s
                )}</b></p>
                <p class="meter m-light"><span>Lightness</span><i><i style="transform:scaleX(var(--l))"></i></i><b data-t="l">${escapeHtml(
                  model.text.l
                )}</b></p>
                <p class="meter m-alpha"><span>Alpha</span><i><i style="transform:scaleX(var(--a))"></i></i><b data-t="a">${escapeHtml(
                  model.text.a
                )}</b></p>
              </div>
            </div>`
    )}
          ${call(model.text)}`,

  toHex: spellingBody,
  toRgba: spellingBody,
  toHsla: spellingBody,

  rgba: (model, p) =>
    `${stage(
      `<div class="mixer">
              <div class="mixer-rails">
                ${(
                  [
                    ['red', 255, 1],
                    ['green', 255, 1],
                    ['blue', 255, 1],
                    ['alpha', 1, 0.01],
                  ] as Array<[string, number, number]>
                )
                  .map(([name, max, step]) =>
                    rail(model.text, {
                      param: name,
                      label: name,
                      min: 0,
                      max,
                      step,
                      value: p[name],
                      track: `var(--t-${name})`,
                      checker: name === 'alpha',
                    })
                  )
                  .join('\n                ')}
              </div>
              ${swatch('res', 'rgba', 'sw-res')}
            </div>`
    )}
          ${call(
            model.text,
            '<button type="button" class="btn btn-small needs-js" data-use>Make this my color</button>'
          )}`,

  hsla: (model, p) =>
    `${stage(
      `<div class="mixer">
              <div class="mixer-rails">
                ${(
                  [
                    ['hue', 359, 1],
                    ['saturation', 1, 0.01],
                    ['lightness', 1, 0.01],
                    ['alpha', 1, 0.01],
                  ] as Array<[string, number, number]>
                )
                  .map(([name, max, step]) =>
                    rail(model.text, {
                      param: name,
                      label: name,
                      min: 0,
                      max,
                      step,
                      value: p[name],
                      track: `var(--t-${name})`,
                      checker: name === 'alpha',
                    })
                  )
                  .join('\n                ')}
              </div>
              ${swatch('res', 'hsla', 'sw-res')}
            </div>`
    )}
          ${call(
            model.text,
            '<button type="button" class="btn btn-small needs-js" data-use>Make this my color</button>'
          )}`,

  darken: rampBody(
    'darken',
    'Your color is already black, so there is nowhere darker to go. <button type="button" class="link" data-pick="#ff2d6f">Try pink</button>'
  ),
  lighten: rampBody(
    'lighten',
    'Your color is already white, so there is nowhere lighter to go. <button type="button" class="link" data-pick="#4a35e8">Try indigo</button>'
  ),
  saturate: rampBody(
    'saturate',
    'Your color is as saturated as it gets, so every step looks the same. <button type="button" class="link" data-pick="#b8798c">Try a dusty pink</button>'
  ),
  desaturate: rampBody(
    'desaturate',
    'Your color is already gray, so there is nothing to take out. <button type="button" class="link" data-pick="#ff2d6f">Try pink</button>'
  ),

  adjustHue: (model, p) =>
    `${stage(
      `<div class="turn">
              <div class="ring" data-ring>
                <svg viewBox="-100 -100 200 200" aria-hidden="true">
                  <defs><path id="hw" d="${wedge(62, 96, 14)}" /></defs>
                  ${Array.from(
                    { length: 24 },
                    (_, index) =>
                      `<use href="#hw" transform="rotate(${index * 15})" style="fill:var(--w${index})" />`
                  ).join('')}
                  <circle class="ring-arc" r="54" pathLength="360" transform="rotate(-90)" />
                  <g class="ring-hand"><path d="M0 -58V-100" /><circle cy="-79" r="9" /></g>
                </svg>
                <div class="ring-hub"><b data-t="degrees">${escapeHtml(model.text.degrees)}</b></div>
              </div>
              <div class="turn-side">
                ${fromTo('adjustHue')}
                ${rail(model.text, {
                  param: 'degrees',
                  label: 'degrees',
                  min: 0,
                  max: 360,
                  step: 1,
                  value: p.degrees,
                  track: 'transparent',
                })}
                ${chips(
                  'degrees',
                  'Jump to',
                  [
                    { value: 30, label: 'Neighbor 30°' },
                    { value: 120, label: 'Triad 120°' },
                    { value: 180, label: 'Complement 180°' },
                    { value: 240, label: 'Triad 240°' },
                  ],
                  p.degrees
                )}
              </div>
            </div>`
    )}
          ${hint(
            'stuck',
            'Your color is gray, and gray has no hue to turn. <button type="button" class="link" data-pick="#ff2d6f">Try pink</button>'
          )}
          ${call(model.text)}`,

  opacify: alphaBody(
    'opacify',
    'Your color is already solid, so there is nothing to add. <button type="button" class="link" data-pick="rgba(74, 53, 232, 0.5)">Try a see-through indigo</button>'
  ),
  transparentize: alphaBody(
    'transparentize',
    'Your color is already fully see-through. <button type="button" class="link" data-pick="#ff2d6f">Try pink</button>'
  ),

  mix: (model, p) =>
    `${stage(
      `<div class="blend">
              ${swatch('from', 'Your color')}
              ${rail(model.text, {
                param: 'weight',
                label: 'weight',
                min: 0,
                max: 1,
                step: 0.01,
                value: p.weight,
                track: 'var(--blend)',
                checker: true,
              })}
              <button type="button" class="sw" data-k="to" style="--sw:var(--to);--sw-on:var(--to-on)"><span data-t="to">${escapeHtml(
                model.text.to
              )}</span></button>
            </div>
            ${swatch('res', 'mix', 'sw-wide sw-res')}
            ${chips('other', 'Mix with', OTHERS.slice(2).concat(OTHERS.slice(0, 2)), p.other)}`
    )}
          ${call(model.text)}`,

  getScale: (model, p) =>
    `${stage(
      `${chips(
        'set',
        'Through',
        [
          { value: 'rainbow', label: 'Rainbow from your color' },
          { value: 'sunset', label: 'Sunset' },
          { value: 'lagoon', label: 'Lagoon' },
          { value: 'tints', label: 'White to black' },
          { value: 'pair', label: 'Your color to its complement' },
        ],
        p.set
      )}
            ${rail(model.text, {
              param: 'at',
              label: 'reading',
              slot: 'code',
              min: 0,
              max: 1,
              step: 0.01,
              value: p.at,
              track: 'var(--ribbon)',
              checker: true,
            })}
            <div class="steps chk" data-steps style="--fill:var(--steps)" title="Tap a step to copy it"></div>
            ${rail(model.text, {
              param: 'steps',
              label: 'steps',
              min: 2,
              max: 24,
              step: 1,
              value: p.steps,
              track: 'transparent',
            })}`
    )}
          ${call(
            model.text,
            `<code class="call-in call-make" data-t="make">${escapeHtml(model.text.make)}</code>`
          )}`,

  getContrast: (model, p) =>
    `${contrastStage(
      model,
      `<div class="ratio">
              <p class="ratio-big"><b data-t="ratio">${escapeHtml(model.text.ratio)}</b> <span data-t="grade">${escapeHtml(
                model.text.grade
              )}</span></p>
              <div class="rule" aria-hidden="true">
                <i class="rule-at"></i>
                <span style="--x:0">1</span><span style="--x:0.3608">3</span><span style="--x:0.494">4.5</span><span style="--x:0.6392">7</span><span style="--x:1">21</span>
              </div>
            </div>
            ${chips('other', 'Against', OTHERS, p.other)}`
    )}
          ${hint('alpha', ALPHA_NOTE)}
          ${call(model.text)}`,

  getLuminance: (model) =>
    `${stage(
      `<div class="lum">
              ${swatch('res', 'Your color', 'sw-res')}
              <div class="rule rule-lum" aria-hidden="true">
                <i class="rule-at"></i>
                <span style="--x:0">0 black</span><span style="--x:0.179" class="rule-note">0.179</span><span style="--x:1">1 white</span>
              </div>
              <p class="note">Above 0.179, <a href="#readableColor">readableColor</a> answers black.</p>
            </div>`
    )}
          ${hint('alpha', ALPHA_NOTE)}
          ${call(model.text)}`,

  hasBadContrast: (model, p, { models }) =>
    `${contrastStage(
      model,
      `<table class="grades">
              <thead><tr><th scope="col">standard</th><th scope="col">needs</th><th scope="col">returns</th></tr></thead>
              <tbody>
                ${(
                  [
                    ['decorative', '1.5:1'],
                    ['readable', '3:1'],
                    ['aa', '4.5:1'],
                    ['aaa', '7:1'],
                  ] as Array<[string, string]>
                )
                  .map(
                    ([standard, needs]) =>
                      `<tr data-row="${standard}"><th scope="row"><code>'${standard}'</code></th><td>${needs}</td><td><code data-t="${standard}">${model.text[standard]}</code></td></tr>`
                  )
                  .join('\n                ')}
              </tbody>
            </table>
            <p class="note">Your color on this background is <b data-t="ratio">${escapeHtml(
              model.text.ratio
            )}</b>.</p>
            ${chips('other', 'Background', OTHERS, p.other)}`
    )}
          ${hint('alpha', ALPHA_NOTE)}
          ${call(model.text)}`,

  readableColor: (model) =>
    `${stage(
      `<div class="pair"><div class="sw sw-res sw-label" style="--sw:var(--res);--sw-on:var(--res-on)"><span>Label</span></div></div>
            ${lightnessCells(() => 'Aa')}
            <p class="note">The same hue from light to dark. The label flips where black stops reading.</p>`
    )}
          ${hint('alpha', ALPHA_NOTE)}
          ${call(model.text)}`,

  readableColorIsBlack: (model) =>
    `${stage(
      `<div class="flip flip-words chk-cut">${Array.from(
        { length: 10 },
        (_, index) =>
          `<span style="background:var(--c${index});color:var(--c${index}-on)" data-t="t${index}">${model.text[`t${index}`]}</span>`
      ).join('')}</div>
            <p class="note">The same ramp, with the boolean each step returns.</p>`
    )}
          ${hint('alpha', ALPHA_NOTE)}
          ${call(model.text)}`,

  guard: (model, p) =>
    `${stage(
      `<div class="clamp">
              <label class="rail">
                <span class="rail-name">value <b data-t="value">${escapeHtml(model.text.value)}</b></span>
                <span class="rail-track clamp-track">
                  <span class="clamp-zone" aria-hidden="true"></span>
                  <i class="clamp-out" aria-hidden="true"></i>
                  <input class="needs-js" type="range" data-param="value" min="-0.5" max="1.5" step="0.01" value="${p.value}" />
                </span>
                <span class="rail-ends clamp-ends" aria-hidden="true"><span style="--x:0.25">low 0</span><span style="--x:0.75">high 1</span></span>
              </label>
              <p class="note" data-flag="clamped">Past the rail. The dot is what <code>guard</code> hands back.</p>
            </div>`
    )}
          ${call(model.text)}`,

  ColorError: (model, p) =>
    `${stage(
      `<label class="field">
              <span class="rail-name">A string to parse</span>
              <input class="needs-js" type="text" data-param="input" value="${escapeHtml(
                p.input
              )}" maxlength="64" autocomplete="off" autocapitalize="off" spellcheck="false" />
            </label>
            ${chips(
              'input',
              'Try',
              [
                { value: 'not-a-color', label: 'not-a-color' },
                { value: '#12345', label: '#12345' },
                { value: 'rgb(13 110 253)', label: 'rgb(13 110 253)' },
                { value: 'oklch(70% 0.2 30)', label: 'oklch(70% 0.2 30)' },
                { value: 'tomato', label: 'tomato' },
              ],
              p.input
            )}
            <p class="verdict"><i style="background:var(--res)"></i><span data-t="verdict">${escapeHtml(
              model.text.verdict
            )}</span></p>`
    )}
          ${call(model.text)}`,
};

/** One demo, drawn with the default color. */
export function renderDemo(name: string, context: Context) {
  const { models, color } = context;
  const body = bodies[name];
  if (!body || !models.demos[name]) {
    throw new Error(`Add a demo for ${name} to website/demos.ts and website/models.js`);
  }
  const p = models.start(name, color);
  const model: Model = models.demos[name](color, p, ctx);

  const raised = model.flags || {};

  return `<div class="demo demo-${name}" data-demo="${name}" style="${escapeHtml(styleOf(model.vars))}">
          ${body(model, p, context)
            // Notes and table rows start in the state the model put them in.
            .replace(/data-flag="(\w+)"/g, (match, flag) => (raised[flag] ? match : `${match} hidden`))
            .replace(/data-row="(\w+)"/g, (match, flag) => `${match} data-on="${Boolean(raised[flag])}"`)}
        </div>`;
}

export const demoNames = Object.keys(bodies);
