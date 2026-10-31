'use client';
import {ViaticosWorkspace} from '../viaticos-ui';
import {Notifications} from '../notifications';
import {SessionControls} from '../session-controls';
export default function Viaticos(){return <main className="cajaOnly"><header><img width="150" src="/repindsa-logo.png" alt="REPINDSA"/><h1>Viáticos</h1><SessionControls/></header><Notifications/><ViaticosWorkspace/></main>}
