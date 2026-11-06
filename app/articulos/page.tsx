'use client';
import {CatalogReviewWorkspace} from '../catalog-review-ui';
import {SessionControls} from '../session-controls';
export default function CatalogReview(){return <main className="materialAccess"><header className="catalogReviewPageHeader"><div><h1>Control de artículos</h1><a href="/materiales">Volver a Materiales</a></div><SessionControls/></header><CatalogReviewWorkspace/></main>}
