import {create} from 'zustand';
import type {Territory} from './v6-types';
import {useBuilder} from '../world/useBuilder';
export const useTerritory=create<{realm:Territory;select:(realm:Territory)=>void}>(set=>({realm:'main',select:realm=>{useBuilder.getState().clear();set({realm});}}));
