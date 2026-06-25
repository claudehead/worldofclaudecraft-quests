import { chromium } from 'playwright';
const OUT = process.argv[2];
const svg = (s) => `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f0c878"/><stop offset="1" stop-color="#9b8cff"/></linearGradient>
  </defs>
  <rect width="512" height="512" rx="112" fill="#0b0b12"/>
  <rect x="40" y="40" width="432" height="432" rx="92" fill="url(#g)"/>
  <g fill="#0b0b12">
    <!-- blade -->
    <path d="M256 96 L284 140 L284 320 L256 348 L228 320 L228 140 Z"/>
    <!-- crossguard -->
    <rect x="176" y="320" width="160" height="26" rx="8"/>
    <!-- grip -->
    <rect x="244" y="346" width="24" height="56"/>
    <!-- pommel -->
    <circle cx="256" cy="416" r="20"/>
  </g>
</svg>`;
const b = await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const p = await b.newPage();
for (const s of [192,512,180]) { await p.setContent(`<body style="margin:0">${svg(s)}</body>`); await (await p.$('svg')).screenshot({ path: `${OUT}/icon-${s}.png`, omitBackground:true }); }
await b.close(); console.log('icons written');
