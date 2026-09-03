export const normalizeUrl = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return '';
  return /^[a-z][a-z\d+.-]*:/i.test(trimmed) ? trimmed : `https://${trimmed}`;
};

export const isValidWebUrl = (value: string) => {
  if (!value.trim()) return true;

  try {
    const url = new URL(normalizeUrl(value));
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
};
