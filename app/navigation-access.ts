import {incidentAccess} from './hr-incidents-model';
import {featureAllowed} from './feature-policy';
export function canOpenIncidents(profile:Record<string,any>){const access=incidentAccess(profile);return featureAllowed(profile,'hrIncident')&&(access.manage||access.view||access.report)}
