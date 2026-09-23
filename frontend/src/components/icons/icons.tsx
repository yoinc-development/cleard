import type { SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement>

function base(props: IconProps): IconProps {
  return {
    width: 18,
    height: 18,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': true,
    ...props,
  }
}

export function ChevronLeftIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M15 5 8 12l7 7" />
    </svg>
  )
}

export function ChevronRightIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M9 5l7 7-7 7" />
    </svg>
  )
}

export function ChevronDownIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M5 9l7 7 7-7" />
    </svg>
  )
}

export function GridIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <rect x="4" y="4" width="7" height="7" rx="1.5" />
      <rect x="13" y="4" width="7" height="7" rx="1.5" />
      <rect x="4" y="13" width="7" height="7" rx="1.5" />
      <rect x="13" y="13" width="7" height="7" rx="1.5" />
    </svg>
  )
}

export function SwapIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M7 4v13M7 17l-3.5-3.5M7 17l3.5-3.5" />
      <path d="M17 20V7M17 7l3.5 3.5M17 7l-3.5 3.5" />
    </svg>
  )
}

export function TagIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M11.5 3.5H6a2.5 2.5 0 0 0-2.5 2.5v5.5L13 21l7.5-7.5L11.5 3.5Z" />
      <circle cx="8.5" cy="8.5" r="1.25" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function GaugeIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M4 15a8 8 0 0 1 16 0" />
      <path d="M12 15l4-5" />
    </svg>
  )
}

export function GearIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="12" r="3.25" />
      <path d="M12 3.5v2.3M12 18.2v2.3M20.5 12h-2.3M5.8 12H3.5M17.7 6.3l-1.6 1.6M7.9 16.1l-1.6 1.6M17.7 17.7l-1.6-1.6M7.9 7.9 6.3 6.3" />
    </svg>
  )
}

export function SearchIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="M20 20l-4.8-4.8" />
    </svg>
  )
}

export function PlusIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
}

export function CloseIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  )
}

export function MinusIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M5 12h14" />
    </svg>
  )
}

export function FilterIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M4 5h16M7 12h10M10 19h4" />
    </svg>
  )
}

export function EditIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5Z" />
    </svg>
  )
}

export function DeleteIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v6M14 11v6" />
    </svg>
  )
}
