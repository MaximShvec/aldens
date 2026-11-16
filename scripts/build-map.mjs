// Generates assets/europe.svg — countries where Aldens installs + project pins + arcs from Riga.
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { geoConicConformal, geoPath, geoGraticule10, geoInterpolate } from 'd3-geo';
import { feature } from 'topojson-client';
import { presimplify, simplify, quantile } from 'topojson-simplify';

const require = createRequire(import.meta.url);
const topo = require('world-atlas/countries-50m.json');
const pre = presimplify(topo);
const simp = simplify(pre, quantile(pre, 0.35));
const countries = feature(simp, simp.objects.countries).features;

const W = 1000;
const H = 720;

// Installation geography (aldens.eu/installation) + Latvia (HQ) + France/Monaco (reference projects)
const INSTALL = ['Sweden', 'Belgium', 'Denmark', 'Luxembourg', 'Finland', 'United Kingdom', 'Norway', 'Ireland', 'Netherlands', 'Iceland'];
const HQ = 'Latvia';
const REF = ['France'];

const pins = [
  { id: 'riga', label: 'Riga — HQ & production', coord: [24.1052, 56.9496], hq: true, dx: 14, dy: 4 },
  { id: 'monaco', label: 'Monaco · Nice', coord: [7.42, 43.74], dx: 14, dy: 4 },
  { id: 'hemsedal', label: 'Hemsedal', coord: [8.4, 60.86], dx: -14, dy: -8, anchor: 'end' },
  { id: 'iceland', label: 'Iceland', coord: [-19.0, 64.9], dx: 14, dy: -6 },
  { id: 'stockholm', label: 'Sweden', coord: [16.5, 59.6], dx: -14, dy: 18, anchor: 'end' }
];

const projection = geoConicConformal()
  .parallels([42, 66])
  .rotate([-14, 0])
  .clipExtent([[0, 0], [W, H]])
  .fitExtent(
    [
      [10, 10],
      [W - 10, H - 10]
    ],
    { type: 'MultiPoint', coordinates: [[-25, 64], [-12, 52], [6, 41], [34, 58], [32, 70], [14, 71.5]] }
  );

const path = geoPath(projection).digits(1);

const out = [];
out.push(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="Map of Europe: Aldens installation geography" class="map-svg">`);
out.push(`<defs><clipPath id="mapclip"><rect width="${W}" height="${H}"/></clipPath></defs>`);
out.push(`<g clip-path="url(#mapclip)">`);
out.push(`<path class="grat" d="${path(geoGraticule10())}"/>`);

out.push(`<g class="land">`);
for (const f of countries) {
  const name = f.properties.name;
  const d = path(f);
  if (!d) continue;
  const [[x0, y0], [x1, y1]] = path.bounds(f);
  if (x1 < -20 || x0 > W + 20 || y1 < -20 || y0 > H + 20) continue;
  let cls = 'c';
  if (name === HQ) cls += ' hq';
  else if (INSTALL.includes(name)) cls += ' on';
  else if (REF.includes(name)) cls += ' ref';
  out.push(`<path class="${cls}" data-name="${name}" d="${d}"/>`);
}
out.push(`</g>`);

// arcs from Riga (bowed upward for a "flight path" feel)
const riga = projection(pins[0].coord);
out.push(`<g class="arcs">`);
pins.slice(1).forEach((p, i) => {
  const to = projection(p.coord);
  const mx = (riga[0] + to[0]) / 2;
  const my = (riga[1] + to[1]) / 2;
  const dist = Math.hypot(to[0] - riga[0], to[1] - riga[1]);
  const cx = mx;
  const cy = my - dist * 0.28;
  out.push(
    `<path class="arc" style="--i:${i}" d="M${riga[0].toFixed(1)} ${riga[1].toFixed(1)} Q${cx.toFixed(1)} ${cy.toFixed(1)} ${to[0].toFixed(1)} ${to[1].toFixed(1)}"/>`
  );
});
out.push(`</g>`);

out.push(`<g class="pins">`);
for (const p of pins) {
  const [x, y] = projection(p.coord);
  out.push(
    `<g class="pin${p.hq ? ' pin-hq' : ''}" transform="translate(${x.toFixed(1)} ${y.toFixed(1)})">` +
      `<circle class="pulse" r="6"/><circle class="dot" r="${p.hq ? 6 : 4}"/>` +
      `<text x="${p.dx}" y="${p.dy}" text-anchor="${p.anchor || 'start'}">${p.label}</text></g>`
  );
}
out.push(`</g>`);
out.push(`</g></svg>`);

fs.writeFileSync('assets/europe.svg', out.join('\n'));
console.log('countries:', countries.length, '| size KB:', (out.join('\n').length / 1024).toFixed(0));
const missing = [...INSTALL, HQ, ...REF].filter((n) => !countries.some((c) => c.properties.name === n));
console.log('missing:', missing);
