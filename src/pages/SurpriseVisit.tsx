import {Canvas} from '@react-three/fiber';
import {useQuery} from '@tanstack/react-query';
import {Link,useParams} from 'react-router-dom';
import {configuredMode,getApi} from '../lib/api';
import {useLocale} from '../lib/locale';
import {SurpriseRoom} from '../world/SurpriseRoom';
import {LoadingState} from '../components/Common';
export default function SurpriseVisit(){
 const {token=''}=useParams(),{t}=useLocale(),query=useQuery({queryKey:['surprise-visit',token],enabled:/^[a-f0-9]{64}$/.test(token),queryFn:()=>getApi(configuredMode).surpriseVisit(token),retry:false,refetchInterval:15000});
 return <main className="visit-page"><header className="visit-header"><Link className="brand" to="/">LifeCity 3D</Link><Link to="/city">{t('العودة للعبة','Back to game')}</Link></header>{query.isFetching&&!query.data?<LoadingState/>:query.data?<section className="visit-content"><h1>{query.data.name}</h1><p style={{whiteSpace:'pre-wrap'}}>{query.data.note}</p><div className="panel" style={{height:'min(60vh,560px)',overflow:'hidden'}}><Canvas frameloop="demand" dpr={[1,1.5]} gl={{alpha:false}}><color attach="background" args={['#dce6dc']}/><SurpriseRoom scene={query.data}/></Canvas></div><ul>{query.data.props.filter(p=>p.text).map(p=><li key={p.id}>{p.text}</li>)}</ul><p>{t('مشهد كشفه صاحبه باختياره. لا يشارك الحساب أو المحفظة أو بقية المدينة.','An owner-approved reveal. Account, wallet and other city data stay private.')}</p></section>:<section className="visit-unavailable"><h1>{t('المفاجأة غير متاحة','Surprise unavailable')}</h1><p>{t('قد يكون الرابط أُوقف أو انتهى، أو لم يسمح صاحبه بالكشف.','The link may be disabled, expired, or not revealed by its owner.')}</p></section>}</main>;
}
