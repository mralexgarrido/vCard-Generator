const encoder = new TextEncoder();

export const sanitizeSingleLine = (value: string) => value.replace(/[\r\n]+/g, '').trim();

export const escapeText = (value: string) => value
  .replace(/\\/g, '\\\\')
  .replace(/\r\n|\r|\n/g, '\\n')
  .replace(/;/g, '\\;')
  .replace(/,/g, '\\,');

export const foldContentLine = (line: string, maxBytes = 75): string => {
  if (encoder.encode(line).length <= maxBytes) return line;

  const folded: string[] = [];
  let current = '';
  let currentLimit = maxBytes;

  for (const character of line) {
    if (current && encoder.encode(current + character).length > currentLimit) {
      folded.push(current);
      current = character;
      currentLimit = maxBytes - 1;
    } else {
      current += character;
    }
  }

  if (current) folded.push(current);
  return folded.join('\r\n ');
};

export const buildContent = (lines: string[]) =>
  `${lines.map((line) => foldContentLine(line)).join('\r\n')}\r\n`;
