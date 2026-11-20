// GSM 03.38 extension characters take two septets. Unicode uses UTF-16 units.
const basic = new Set(Array.from("@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ !\"#¤%&'()*+,-./0123456789:;<=>?¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà"))
const extended = new Set(Array.from("\f^{}\\[~]|€"))

export function measureSms(text) {
  let units = 0
  for (const char of text) {
    if (basic.has(char)) units++
    else if (extended.has(char)) units += 2
    else return { units:text.length, limit:70, unicode:true }
  }
  return { units, limit:160, unicode:false }
}
