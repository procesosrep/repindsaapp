export function isTravelKind(kind:string):boolean;
export function travelYear(record?:Record<string,any>):string;
export function nextTravelFolio(db:any,year?:string):Promise<string>;
export function migrateTravelFolios(db:any):Promise<{renamed:number}>;
