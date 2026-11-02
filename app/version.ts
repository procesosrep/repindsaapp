import packageInfo from '../package.json';
export const appVersion='V'+packageInfo.version.split('.').slice(0,2).join('.');
