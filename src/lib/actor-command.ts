/** Only explicit, nonfinancial actor interactions follow the latest queued save.
 * Quotes, settlement, purchases and user-authored geometry retain their revisions. */
const interactions=new Set(['avatar_mode','avatar_enter','avatar_exit','avatar_floor','car_drive','car_exit','car_park']);
export function actorCommandPayload(action:string,payload:Record<string,unknown>,revision:number|undefined){
 if(action!=='world_apply'||!interactions.has(String(payload.operation))||typeof payload.expected_revision!=='number'||revision===undefined||!Number.isSafeInteger(revision)||revision<0||payload.expected_revision===revision)return payload;
 return {...payload,expected_revision:revision};
}
