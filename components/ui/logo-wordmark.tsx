/**
 * Orechdin primary logo — the "ORECH / DIN" wordmark from the brand
 * guidelines (Copperplate Gothic Bold with the signature diagonal slash).
 * Rendered from the brand-owned artwork, extracted straight from the guide.
 *
 * Use the default (black) mark on light backgrounds and `light` (white) on
 * dark backgrounds, per the guidelines' contrast rule.
 */
export function LogoWordmark({
  className,
  light = false,
}: {
  className?: string;
  light?: boolean;
}) {
  const src = light
    ? "/media/site/logo-orechdin-white.webp"
    : "/media/site/logo-orechdin.webp";
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt="Orechdin"
      className={className}
      draggable={false}
    />
  );
}
