/** "<" and "&" would end the SVG text early. */
const escapeXml = (text: string) => text.replace(/[<>&'"]/g, (char) => `&#${char.charCodeAt(0)};`)

/**
 * The buyer's name across bought content (spec section 13), drawn over it without catching the
 * mouse: the text can still be selected and its links followed.
 */
export function Watermark({ text }: { text: string }) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="340" height="190"><text x="170" y="95" text-anchor="middle" transform="rotate(-24 170 95)" fill="#e6e6e6" fill-opacity="0.09" font-family="Inter, sans-serif" font-size="15">${escapeXml(text)}</text></svg>`
  return (
    <div
      aria-hidden
      data-testid="watermark"
      className="pointer-events-none absolute inset-0 select-none"
      style={{ backgroundImage: `url("data:image/svg+xml,${encodeURIComponent(svg)}")` }}
    />
  )
}
