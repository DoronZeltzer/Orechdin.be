export function LogoWordmark({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 520 96" role="img" aria-label="Orechdin — Law Office" className={className}>
      <title>Orechdin — Law Office</title>
      <defs>
        <linearGradient id="bronze" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#8a6230"/>
          <stop offset="1" stopColor="#b08247"/>
        </linearGradient>
      </defs>
      <g className="fill-current">
        <text x="0" y="58"
              className="font-display font-semibold tracking-wide"
              fontSize="56">Orechdin</text>
      </g>
      <rect x="2" y="74" width="64" height="1.5" fill="url(#bronze)"/>
      <text x="74" y="82"
            className="font-sans font-medium tracking-[0.18em]"
            fontSize="11"
            fill="currentColor"
            opacity={0.65}>LAW OFFICE · ANTWERP</text>
    </svg>
  );
}
