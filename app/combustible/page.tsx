'use client';
import {FuelControl} from '../fuel-control-ui';
import {SessionControls} from '../session-controls';
export default function Combustible(){return <main className="cajaOnly"><header><img width="150" src="/repindsa-logo.png" alt="REPINDSA"/><h1>Control de combustible</h1><a href="/caja">Volver a Viáticos</a><SessionControls/></header><FuelControl/></main>}
