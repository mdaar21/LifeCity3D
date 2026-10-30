import {lazy,Suspense} from 'react';
import {Navigate,Route,Routes,useLocation} from 'react-router-dom';
import {useAuth} from './lib/game';
import {useLocale} from './lib/locale';
const AppLayout=lazy(()=>import('./components/AppLayout'));
import {appPath} from './lib/paths';
const Landing=lazy(()=>import('./pages/Landing'));const Auth=lazy(()=>import('./pages/Auth'));const Dashboard=lazy(()=>import('./pages/Dashboard'));const Shop=lazy(()=>import('./pages/Shop'));const Tasks=lazy(()=>import('./pages/Tasks'));const Timer=lazy(()=>import('./pages/Timer'));const Prayers=lazy(()=>import('./pages/Prayers'));const Interior=lazy(()=>import('./pages/Interior'));const Yuyi=lazy(()=>import('./pages/Yuyi'));const Stats=lazy(()=>import('./pages/Stats'));const Settings=lazy(()=>import('./pages/Settings'));
const Legal=lazy(()=>import('./pages/Legal'));
const Economy=lazy(()=>import('./pages/Economy'));
const Pricing=lazy(()=>import('./pages/Pricing'));const Visit=lazy(()=>import('./pages/Visit'));
function Loading(){const {t}=useLocale();return <div className="app-loading" role="status"><img src={appPath('icons/icon.svg')} width="60" height="60" alt=""/><p>{t('نجهّز مساحة لإنجازاتك…','Making room for your progress…')}</p></div>;}
function Private(){const {user,loading}=useAuth();const location=useLocation();return loading?<Loading/>:user?<AppLayout/>:<Navigate to="/login" state={{from:location.pathname+location.search}} replace/>;}
export default function App(){return <Suspense fallback={<Loading/>}><Routes><Route path="/" element={<Landing/>}/><Route path="/pricing" element={<Pricing/>}/><Route path="/visit" element={<Visit/>}/><Route path="/privacy" element={<Legal/>}/><Route path="/terms" element={<Legal/>}/><Route path="/refunds" element={<Legal/>}/><Route path="/login" element={<Auth/>}/><Route path="/reset-password" element={<Auth/>}/><Route element={<Private/>}><Route path="/dashboard" element={<Dashboard/>}/><Route path="/city" element={null}/><Route path="/shop" element={<Shop/>}/><Route path="/tasks" element={<Tasks/>}/><Route path="/timer" element={<Timer/>}/><Route path="/prayers" element={<Prayers/>}/><Route path="/interior" element={<Interior/>}/><Route path="/interior/:houseId" element={<Interior/>}/><Route path="/yuyi" element={<Yuyi/>}/><Route path="/stats" element={<Stats/>}/><Route path="/settings" element={<Settings/>}/><Route path="/economy" element={<Economy/>}/></Route><Route path="*" element={<Navigate to="/" replace/>}/></Routes></Suspense>;}
