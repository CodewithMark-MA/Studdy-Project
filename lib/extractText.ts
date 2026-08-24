export function fitExtractedText(text: string, maxLength: number): string {
  const normalized = text.replace(/\s+/g, ' ').trim();

  if (normalized.length <= maxLength) {
    return normalized;
  }

  const separator = '\n\n[Middle content omitted to fit the study limit]\n\n';
  const availableLength = maxLength - separator.length;
  const beginningLength = Math.ceil(availableLength * 0.75);
  const endingLength = availableLength - beginningLength;

  return `${normalized.slice(0, beginningLength).trim()}${separator}${normalized.slice(-endingLength).trim()}`;
}