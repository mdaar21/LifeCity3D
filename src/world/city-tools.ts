import {useTouchTools} from './useTouchTools';
import {useWorldUI} from './useWorldUI';
/** A single entrance into city categories. Changing menus never spends money. */
export function openCityTool(tool:'build'|'catalog'|'nature'|'furniture'|'road'|'vehicles'){
 const tools=useTouchTools.getState();tools.cancel();tools.set({selection:null,sheet:null,help:false,finishPreview:null,designOpen:false,pendingTool:tool});
 useWorldUI.getState().set({open:false,ghost:null,replay:null,...(tool==='furniture'?{}:{selected:null,floor:null,cutawayAll:false,inspectFocus:false})});
}
export function closeCityPanels(preserveContext=false){
 const tools=useTouchTools.getState();tools.cancel();tools.set({selection:null,sheet:null,help:false,finishPreview:null,designOpen:false,pendingTool:null});
 useWorldUI.getState().set({open:false,ghost:null,replay:null,...(preserveContext?{}:{selected:null,floor:null,cutawayAll:false,inspectFocus:false})});
}
