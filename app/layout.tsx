import {DialogViewport} from './dialog-viewport';
import {ModuleBoundary} from './module-boundary';
import {PwaControls} from './pwa-controls';
import './globals.css';
export const viewport={width:'device-width',initialScale:1,viewportFit:'cover',themeColor:'#142d50'};
export const metadata={metadataBase:new URL('https://repindsa-app.com'),title:'REPINDSA',description:'Solicitudes, viáticos, inventarios y gestión por proyectos de REPINDSA',manifest:'/manifest.webmanifest',appleWebApp:{capable:true,title:'REPINDSA',statusBarStyle:'default'},icons:{icon:[{url:'/icons/favicon-32.png',sizes:'32x32',type:'image/png'},{url:'/icons/icon-192.png',sizes:'192x192',type:'image/png'},{url:'/icons/icon-512.png',sizes:'512x512',type:'image/png'}],apple:[{url:'/icons/apple-touch-icon.png',sizes:'180x180',type:'image/png'}]}};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="es"><body><ModuleBoundary>{children}</ModuleBoundary><DialogViewport/><PwaControls/></body></html>}
