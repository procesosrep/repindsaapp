export const folioCycles:string[][];
export function folioSpec(kind:string,record?:Record<string,any>):{prefix:string,cycle:string}|null;
export function folioKey(spec:{prefix:string,cycle:string}):string;
export function formatFolio(spec:{prefix:string,cycle:string},value:number):string;
