export type QueryResult = {success: boolean;results: any[];meta:{changes:number;last_row_id:number}};
export class Statement {bind(...args:any[]):Statement; all():Promise<QueryResult>;run():Promise<QueryResult>;first(column?:string):Promise<any>;}
export class Database {readonly dialect?: "mysql" | "sqlite";constructor(client:any);prepare(sql:string):Statement;batch(statements:Statement[]):Promise<QueryResult[]>;}
export const env:{DB:Database;BUCKET:any;[key:string]:any};
export class LocalBucket {constructor(root:string);put(key:string,body:any):Promise<void>;get(key:string):Promise<any>;delete(key:string):Promise<void>;}
export class S3Bucket {constructor();put(key:string,body:any,options?:any):Promise<void>;get(key:string):Promise<any>;delete(key:string):Promise<void>;}
export function createDatabase():Database;
