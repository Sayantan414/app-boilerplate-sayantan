import { NavItem } from './navigation/navigation.component';

export const NAV_ITEMS: NavItem[] = [
  {
    id: 'appdashboard',
    title: 'App Dashboard',
    translate: 'NAV.SAMPLE.TITLE',
    type: 'item',
    icon: 'dashboard',
    url: '/app-dashboard',
    privilege: ['App Dashboard'],
  },
  {
    id: 'dashboard',
    title: 'Dashboard',
    translate: 'NAV.SAMPLE.TITLE',
    type: 'item',
    icon: 'dashboard',
    url: '/dashboard',
    // privilege: ['View Dashboard'],
  },

  {
    id: 'user',
    title: 'Users',
    translate: 'NAV.SAMPLE.TITLE',
    type: 'item',
    icon: 'group',
    url: '/users',
    privilege: ['View User'],
  },
  {
    id: 'user-log',
    title: 'User Log',
    translate: 'NAV.SAMPLE.TITLE',
    type: 'item',
    icon: 'person',
    url: '/user-log',
    feature: 'Settings',
    privilege: ['View User Log'],
  },

  {
    id: 'Settings',
    title: 'Settings',
    type: 'collapsable',
    feature: 'Settings',
    icon: 'settings',
    url: '/settings',
    privilege: ['View Role'],
    children: [
      {
        id: 'Role',
        title: 'Roles',
        type: 'item',
        icon: 'shield',
        url: '/settings/roles',
        privilege: ['View Role'],
      },

    ],
  }
];
