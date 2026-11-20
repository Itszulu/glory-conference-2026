// GSM 03.38 extension characters take two septets. Unicode uses UTF-16 units.
const basic = new Set(Array.from("@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ !\"#¤%&'()*+,-./0123456789:;<=>?¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà"))
const extended = new Set(Array.from("\f^{}\\[~]|€"))

export function measureSms(text, maxPages = 1) {
  const chars = Array.from(text)
  const unicode = chars.some(char => !basic.has(char) && !extended.has(char))
  const single = unicode ? 70 : 160
  const segment = unicode ? 67 : 153
  let units = 0, used = 0, segments = 1
  for (const char of chars) {
    const size = unicode ? char.length : extended.has(char) ? 2 : 1
    if (used + size > segment) { segments++; used = 0 }
    used += size
    units += size
  }
  const pages = units <= single ? Number(units > 0) : segments
  return { units, pages, unicode, limit: maxPages === 2 ? 2 * segment : single }
}

export function estimatedKobo(recipients, pages) {
  return Math.round(recipients * pages * 649 * 1075 / 1000)
}
