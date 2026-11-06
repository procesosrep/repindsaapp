import {Truck,UsersRound,type LucideProps} from 'lucide-react';
export function OperationsIcon({size=24,...props}:LucideProps){return <svg {...props} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" data-cycle-icon="tank-and-pipe"><ellipse cx="16.5" cy="5" rx="5.5" ry="2.5"/><path d="M11 5v13c0 1.4 2.5 2.5 5.5 2.5S22 19.4 22 18V5M11 18c0-1.4 2.5-2.5 5.5-2.5S22 16.6 22 18M14 20.3V23m5-2.7V23M2 2v10a4 4 0 0 0 4 4h5M0 5h4M0 8h4"/></svg>}
export const SuppliesIcon=(props:LucideProps)=><Truck {...props} data-cycle-icon="supply-truck"/>;
export const PeopleIcon=(props:LucideProps)=><UsersRound {...props} data-cycle-icon="people"/>;
