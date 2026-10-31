export function nextFolio(db:any,kind:string,record?:Record<string,any>):Promise<string>;
export function migrateFolios(db:any):Promise<{renamed:number}>;
