import { Link } from 'react-router'

/** Brand colours are reserved for the logo (spec section 8). */
export function Logo() {
  return (
    <Link to="/" aria-label="CMarket" className="flex shrink-0 items-center gap-2">
      <svg aria-hidden viewBox="0 0 32 32" className="size-6">
        <rect width="32" height="32" rx="6" fill="var(--brand-navy)" />
        <path
          d="M22.5 10.2a8.4 8.4 0 1 0 0 11.6"
          fill="none"
          stroke="var(--text-primary)"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <path
          d="M11.5 19.5l3.6-3.8 2.6 2.1 4.8-5.3"
          fill="none"
          stroke="var(--brand-green)"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span className="font-sans text-[18px] font-bold">
        <span className="text-primary">C</span>
        <span className="text-brand-green">Market</span>
      </span>
    </Link>
  )
}
