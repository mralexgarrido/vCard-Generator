export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url; link.download = filename;
  document.body.appendChild(link); link.click(); link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 10000);
}

export async function copyText(value: string): Promise<void> {
  if (navigator.clipboard?.writeText) { await navigator.clipboard.writeText(value); return; }
  const active = document.activeElement as HTMLElement | null;
  const input = document.createElement('textarea');
  input.value = value; input.style.cssText = 'position:fixed;top:0;left:0;opacity:0;';
  document.body.appendChild(input); input.select();
  const copied = document.execCommand('copy'); input.remove(); active?.focus();
  if (!copied) throw new Error('Clipboard access is unavailable. Download the file instead.');
}

/** A four-module minimum quiet zone is included in every exported code. */
export function serializeQr(source: SVGSVGElement): string {
  const [x, y, width, height] = (source.getAttribute('viewBox') || '0 0 256 256').split(/\s+/).map(Number);
  if (![x, y, width, height].every(Number.isFinite) || width <= 0 || height <= 0) throw new Error('The QR preview is not ready.');
  const padding = Math.max(4, Math.ceil(Math.max(width, height) * 0.1));
  const wrapper = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  wrapper.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  wrapper.setAttribute('viewBox', `${x - padding} ${y - padding} ${width + 2 * padding} ${height + 2 * padding}`);
  wrapper.setAttribute('width', String(width + 2 * padding));
  wrapper.setAttribute('height', String(height + 2 * padding));
  wrapper.setAttribute('shape-rendering', 'crispEdges');
  const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  for (const [name, value] of Object.entries({ x: x - padding, y: y - padding, width: width + 2 * padding, height: height + 2 * padding, fill: '#ffffff' })) rect.setAttribute(name, String(value));
  wrapper.appendChild(rect);
  source.childNodes.forEach((child) => wrapper.appendChild(child.cloneNode(true)));
  return new XMLSerializer().serializeToString(wrapper);
}

export function svgToPng(svg: string, width: number, height = width): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }));
    const image = new Image();
    const cleanup = () => { clearTimeout(timeout); URL.revokeObjectURL(url); };
    const timeout = window.setTimeout(() => { cleanup(); reject(new Error('Image export timed out. Try SVG or the contact/calendar file.')); }, 15000);
    image.onerror = () => { cleanup(); reject(new Error('Image export failed. Try SVG or the contact/calendar file.')); };
    image.onload = () => {
      try {
        const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height;
        const context = canvas.getContext('2d');
        if (!context) throw new Error('This browser cannot create PNG images. Download SVG instead.');
        context.fillStyle = '#ffffff'; context.fillRect(0, 0, width, height);
        context.imageSmoothingEnabled = false; context.drawImage(image, 0, 0, width, height);
        canvas.toBlob((blob) => { cleanup(); if (blob) resolve(blob); else reject(new Error('PNG export failed. Download SVG instead.')); }, 'image/png');
      } catch (error) { cleanup(); reject(error); }
    };
    image.src = url;
  });
}
