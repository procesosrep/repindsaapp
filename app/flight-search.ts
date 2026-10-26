type R=Record<string,any>;
export function freeFlightSearch(d:R,airline=''){
 const origin=String(d.origin||'').trim(),destination=String(d.destination||'').trim();
 if(!origin||!destination)throw Error('Completa origen y destino para buscar precios.');
 if(origin.toLocaleLowerCase('es-MX')===destination.toLocaleLowerCase('es-MX'))throw Error('Origen y destino deben ser diferentes.');
 const valid=(s:string)=>/^\d{4}-\d{2}-\d{2}$/.test(s)&&!isNaN(Date.parse(s))&&new Date(s).toISOString().slice(0,10)===s;
 if(!valid(d.travelDate))throw Error('Selecciona la fecha de salida.');
 if(d.returnDate&&(!valid(d.returnDate)||d.returnDate<d.travelDate))throw Error('Revisa la fecha de regreso.');
 const passengers=Number(d.passengers);if(!Number.isInteger(passengers)||passengers<1||passengers>99)throw Error('Indica el número de pasajeros.');
 if(airline&&!['Aeroméxico','Volaris','Viva Aerobus'].includes(airline))throw Error('Aerolínea no válida.');
 const query=`Flights from ${origin.slice(0,150)} to ${destination.slice(0,150)} on ${d.travelDate}${d.returnDate?' returning '+d.returnDate:' one way'} for ${passengers} adults economy${airline?' '+airline:''}`;
 const url=new URL('https://www.google.com/travel/flights');url.search=new URLSearchParams({q:query,hl:'es',gl:'MX',curr:'MXN'}).toString();return url.toString();
}
