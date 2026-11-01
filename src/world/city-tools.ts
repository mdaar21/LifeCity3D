import {useTouchTools} from './useTouchTools';
import {useWorldUI} from './useWorldUI';
/** A single entrance into city categories. Changing menus never spends money. */
export function openCityTool(tool:'build'|'catalog'|'nature'|'road'|'vehicles'){
 const tools=useTouchTools.getState();tools.cancel();tools.set({selection:null,sheet:null,help:false,finishPreview:null,designOpen:false,pendingTool:tool==='vehicles'?'vehicles':tool});
 useWorldUI.getState().set({open:false,ghost:null,selected:null,floor:null,cutawayAll:false,inspectFocus:false,replay:null});
}
export function closeCityPanels(){
 const tools=useTouchTools.getState();tools.cancel();tools.set({selection:null,sheet:null,help:false,finishPreview:null,designOpen:false,pendingTool:null});
 useWorldUI.getState().set({open:false,ghost:null,selected:null,floor:null,cutawayAll:false,inspectFocus:false,replay:null});
}
