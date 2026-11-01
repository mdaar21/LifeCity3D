import type {ReactNode} from 'react';
import {X} from 'lucide-react';
/** Shared visual and interaction grammar for page windows, catalog and tools. */
export function GamePanelHeader({title,titleId,className='',eyebrow='LifeCity 3D',onClose,closeLabel,children}:{title:string;titleId?:string;className?:string;eyebrow?:string;onClose:()=>void;closeLabel:string;children?:ReactNode}){
 return <header className={'game-panel-header '+className}><div>{eyebrow&&<small>{eyebrow}</small>}<h2 id={titleId}>{title}</h2>{children}</div><button className="game-close" type="button" aria-label={closeLabel} onClick={onClose}><X size={20}/></button></header>;
}
