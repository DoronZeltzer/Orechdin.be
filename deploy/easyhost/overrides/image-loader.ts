/**
 * Image loader for the static build (see next.config.ts next to it).
 *
 * Without the Vercel optimiser nothing resizes images on request, so build.mjs makes one file per size
 * ahead of time: /media/site/antwerp-chambers.webp becomes antwerp-chambers-w640.webp, -w768.webp and so on.
 * The browser then picks the size it needs from the srcset, as it does on Vercel.
 *
 * The size list must match `deviceSizes` and `imageSizes` in next.config.ts; build.mjs reads the same list.
 */
export default function imageLoader({ src, width }: { src: string; width: number; quality?: number }): string {
  return src.replace(/\?.*$/, "").replace(/\.(webp|png|jpe?g)$/i, `-w${width}.webp`);
}
