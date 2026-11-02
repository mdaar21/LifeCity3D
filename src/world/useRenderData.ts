import {useMemo} from 'react';
/** Network snapshots recreate JSON objects. Geometry depends on values, not their identities. */
export function useRenderData<T>(value:T):T{const serialized=JSON.stringify(value);return useMemo(()=>JSON.parse(serialized) as T,[serialized]);}
