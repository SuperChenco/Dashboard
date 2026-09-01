import type { ReactNode, SVGProps } from 'react';

import type { NavIconName } from '@/config/navigation';

interface IconProps extends SVGProps<SVGSVGElement> {
  name: NavIconName;
}

export default function Icon({ name, ...props }: IconProps) {
  const paths: Record<NavIconName, ReactNode> = {
    today: (
      <>
        <rect x="3" y="4.5" width="18" height="16.5" rx="2.5" />
        <path d="M8 2.5v4M16 2.5v4M3 9h18" />
      </>
    ),
    goals: (
      <>
        <circle cx="12" cy="12" r="8.5" />
        <circle cx="12" cy="12" r="4.5" />
        <path d="M12 3.5V1.8M20.5 12h1.7" />
      </>
    ),
    ideas: (
      <>
        <path d="M9 18h6M9.5 21h5" />
        <path d="M8.1 15.7a7 7 0 1 1 7.8 0c-.8.5-.9 1.1-.9 2.3H9c0-1.2-.1-1.8-.9-2.3Z" />
      </>
    ),
    companies: (
      <>
        <path d="M4 21V5.5A1.5 1.5 0 0 1 5.5 4h8A1.5 1.5 0 0 1 15 5.5V21" />
        <path d="M15 9h3.5a1.5 1.5 0 0 1 1.5 1.5V21M2 21h20M7.5 8h4M7.5 12h4M7.5 16h4" />
      </>
    ),
    people: (
      <>
        <circle cx="9" cy="8" r="3.5" />
        <path d="M3.5 20v-1.5A5.5 5.5 0 0 1 9 13h.5a5.5 5.5 0 0 1 5.5 5.5V20" />
        <path d="M15.5 5.2a3.5 3.5 0 0 1 0 5.6M17 14a5.5 5.5 0 0 1 3.5 5.1V20" />
      </>
    ),
    projects: (
      <>
        <rect x="3" y="5" width="18" height="16" rx="2.5" />
        <path d="M8 5V3.5A1.5 1.5 0 0 1 9.5 2h5A1.5 1.5 0 0 1 16 3.5V5M3 11h18M10 11v2h4v-2" />
      </>
    ),
    opportunities: (
      <>
        <path d="m13 2-8 11h6l-1 9 9-12h-6V2Z" />
      </>
    ),
    health: (
      <path d="M20.8 8.4c0 5.3-8.8 11.1-8.8 11.1S3.2 13.7 3.2 8.4A4.9 4.9 0 0 1 12 5.5a4.9 4.9 0 0 1 8.8 2.9Z" />
    ),
    learning: (
      <>
        <path d="m3 7 9-4 9 4-9 4-9-4Z" />
        <path d="M6 9.2V15c3.5 3 8.5 3 12 0V9.2M21 7v7" />
      </>
    ),
    settings: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1A1.7 1.7 0 0 0 9 4.6 1.7 1.7 0 0 0 10 3v-.2h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z" />
      </>
    ),
    menu: <path d="M4 7h16M4 12h16M4 17h16" />,
    close: <path d="m6 6 12 12M18 6 6 18" />,
    search: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-4-4" />
      </>
    ),
    plus: <path d="M12 5v14M5 12h14" />,
    arrow: <path d="m9 18 6-6-6-6" />,
  };

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {paths[name]}
    </svg>
  );
}
