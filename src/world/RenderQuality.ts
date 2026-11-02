import {createContext,useContext} from 'react';
import {graphicsProfile} from './graphics-profile';
export const RenderQuality=createContext(graphicsProfile('medium'));
export const useRenderQuality=()=>useContext(RenderQuality);
