import homeIcon from '../assets/homeBar.svg';
import appointmentsIcon from '../assets/citasBar.svg';
import messagesIcon from '../assets/mensajesBar.svg';
import profileIcon from '../assets/perfilBar.svg';
import servicesIcon from '../assets/serviciosBar.svg';
import { ROLES } from './roles';

const HOME = { messageId: 'Home', path: '/home', icon: homeIcon };
const SERVICES = { messageId: 'Services', path: '/services', icon: servicesIcon };
const APPOINTMENTS = { messageId: 'Works', path: '/appointments', icon: appointmentsIcon };
const MESSAGES = { messageId: 'Messages', path: '/messages', icon: messagesIcon };
const PROFILE = { messageId: 'Profile', path: '/profile', icon: profileIcon };

export const NAVIGATION = {
  [ROLES.CLIENT]: [HOME, SERVICES, APPOINTMENTS, MESSAGES, PROFILE],
  [ROLES.WORKER]: [HOME, PROFILE, APPOINTMENTS, MESSAGES],
};
