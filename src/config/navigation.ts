export type NavIconName =
  | 'today'
  | 'goals'
  | 'ideas'
  | 'companies'
  | 'people'
  | 'projects'
  | 'opportunities'
  | 'health'
  | 'learning'
  | 'settings'
  | 'menu'
  | 'close'
  | 'search'
  | 'plus'
  | 'arrow';

export interface NavigationItem {
  label: string;
  href: string;
  icon: NavIconName;
}

export const primaryNavigation: NavigationItem[] = [
  { label: 'Today', href: '/today', icon: 'today' },
  { label: 'Goals', href: '/goals', icon: 'goals' },
  { label: 'Sprints', href: '/sprints', icon: 'goals' },
  { label: 'Tasks', href: '/tasks', icon: 'today' },
  { label: 'Ideas', href: '/ideas', icon: 'ideas' },
  { label: 'Companies', href: '/companies', icon: 'companies' },
  { label: 'People', href: '/people', icon: 'people' },
  { label: 'Projects', href: '/projects', icon: 'projects' },
  {
    label: 'Opportunities',
    href: '/opportunities',
    icon: 'opportunities',
  },
];

export const secondaryNavigation: NavigationItem[] = [
  { label: 'Health', href: '/health', icon: 'health' },
  { label: 'Learning', href: '/learning', icon: 'learning' },
];

export const mobileNavigation: NavigationItem[] = [
  { label: 'Today', href: '/', icon: 'today' },
  { label: 'Goals', href: '/goals', icon: 'goals' },
  { label: 'Ideas', href: '/ideas', icon: 'ideas' },
];

export function isNavigationItemActive(
  pathname: string,
  href: string,
): boolean {
  if (href === '/today') {
    return pathname === '/' || pathname === '/today';
  }

  if (href === '/') {
    return pathname === '/' || pathname === '/today';
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}
