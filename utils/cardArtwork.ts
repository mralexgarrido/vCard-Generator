/** Loaded only when someone exports a designed card. No screenshots, fonts, or remote assets are fetched. */
export const escapeXml = (value: string) => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '');

export function wrapLines(value: string, length: number, count: number): string[] {
  const characters = Array.from(value.replace(/\s+/g, ' ').trim());
  const lines: string[] = [];
  while (characters.length && lines.length < count) {
    let end = Math.min(length, characters.length);
    if (characters.length > length) {
      const space = characters.slice(0, end).lastIndexOf(' ');
      if (space > length / 2) end = space;
    }
    lines.push(characters.splice(0, end).join('').trim());
    while (characters[0] === ' ') characters.shift();
  }
  if (characters.length && lines.length) lines[lines.length - 1] = `${lines[lines.length - 1].slice(0, -1)}…`;
  return lines;
}

export interface CardArtwork {
  title: string; subtitle: string; lines: string[]; action: string; color: string; qrSvg: string;
}
export function buildCardArtwork({ title, subtitle, lines, action, color, qrSvg }: CardArtwork): string {
  const safeColor = /^#[a-f\d]{6}$/i.test(color) ? color : '#0f172a';
  const text = (value: string, x: number, y: number, size: number, fill: string, weight = 400) => `<text x="${x}" y="${y}" fill="${fill}" font-family="Arial, Helvetica, sans-serif" font-size="${size}" font-weight="${weight}">${escapeXml(value)}</text>`;
  const titleLines = wrapLines(title, 30, 3);
  const subtitleLines = wrapLines(subtitle, 46, 2);
  const detailLines = lines.filter(Boolean).slice(0, 3).map((line) => wrapLines(line, 54, 1)[0] || '');
  const header = titleLines.map((line, i) => text(line, 80, 150 + i * 64, 56, '#ffffff', 700)).join('');
  const sub = subtitleLines.map((line, i) => text(line, 80, 150 + titleLines.length * 64 + 20 + i * 35, 28, '#ffffff')).join('');
  // qrSvg comes exclusively from the locally rendered react-qr-code SVG, never imported user markup.
  const qr = qrSvg.replace(/<svg\b/, '<svg x="240" y="570"').replace(/width="[^"]+"/, 'width="600"').replace(/height="[^"]+"/, 'height="600"');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1400" viewBox="0 0 1080 1400"><rect width="1080" height="1400" fill="#ffffff"/><rect width="1080" height="430" fill="${safeColor}"/>${text('A SMALL CARD. A REAL CONNECTION.', 80, 65, 18, '#ffffff', 700)}${header}${sub}${detailLines.map((line, i) => text(line, 80, 475 + i * 34, 26, '#334155')).join('')}${qr}<text x="540" y="1250" text-anchor="middle" fill="#0f172a" font-family="Arial, Helvetica, sans-serif" font-size="34" font-weight="700">${escapeXml(action)}</text><text x="540" y="1300" text-anchor="middle" fill="#475569" font-family="Arial, Helvetica, sans-serif" font-size="22">Open your camera. Point it at the code.</text></svg>`;
}
