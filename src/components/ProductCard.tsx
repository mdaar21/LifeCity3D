import type {ReactNode} from 'react';
import {AssetThumbnail} from './AssetThumbnail';
/** One card structure for every purchasable catalog, independent of its command. */
export function ProductCard({title,asset,style='forest',price,badge,description,meta,caption,action,onAction,onPreview,disabled=false,locked=false,testId,previewTestId,className=''}:{title:string;asset:string;style?:'forest'|'coastal'|'desert';price:ReactNode;badge?:ReactNode;description?:ReactNode;meta?:ReactNode;caption?:ReactNode;action:string;onAction:()=>void;onPreview?:()=>void;disabled?:boolean;locked?:boolean;testId?:string;previewTestId?:string;className?:string}){
 return <article className={'product-card '+className} data-product={asset} data-locked={locked||undefined}>
  <button type="button" className="product-card-image" data-testid={previewTestId} aria-label={title} onClick={onPreview??onAction} disabled={disabled&&!onPreview}><AssetThumbnail assetKey={asset} architectureStyle={style}/></button>
  <div className="product-card-copy"><div className="product-card-access">{badge}</div><h3>{title}</h3>{description&&<p className="product-card-description">{description}</p>}<strong className="product-card-price">{price}</strong>{caption&&<span className="product-card-caption">{caption}</span>}{meta&&<div className="product-card-meta">{meta}</div>}<button className="product-card-action" type="button" data-testid={testId} disabled={disabled} onClick={onAction}>{action}</button></div>
 </article>;
}
