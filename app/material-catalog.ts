import {warehouseCatalog} from './warehouse-catalog';
import {materialCatalogSeed} from './material-catalog-seed';
type R=Record<string,any>;
export function catalogValue(line:R,source='Histórico'){const clean=(v:any,n:number)=>String(v||'').trim().replace(/\s+/g,' ').slice(0,n);return {description:clean(line.description,300),specification:clean(line.specification,1500),type:clean(line.type,80)||'Material',unit:clean(line.unit,40)||'Pieza',brand:clean(line.brand,120),source};}
export function catalogKey(v:R){return [v.description,v.specification,v.type,v.unit,v.brand].map(x=>String(x||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('es-MX').replace(/\s+/g,' ').trim()).join('|');}
export async function materialCatalog(db:any,_rows:R[]){return warehouseCatalog(db);}
export async function catalogStatements(_db:any,_lines:R[]){return [];}
