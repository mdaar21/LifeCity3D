import {appPath} from '../lib/paths';
import {assetArtPath} from '../world/asset-catalog';
/** Cached renders of the actual procedural assets. No live canvas per card. */
export function AssetThumbnail({assetKey,className=''}:{assetKey:string;className?:string}){return <img className={'asset-photo '+className} data-asset-key={assetKey} src={appPath(assetArtPath(assetKey))} alt="" loading="lazy" decoding="async" width={240} height={180}/>;}
