import {Component,StrictMode} from 'react';
import type {ErrorInfo,ReactNode} from 'react';
import {createRoot} from 'react-dom/client';
import {BrowserRouter,HashRouter} from 'react-router-dom';
import {QueryClient,QueryClientProvider} from '@tanstack/react-query';
import {GameProvider} from './lib/game';
import {LocaleProvider} from './lib/locale';
import App from './App';
import {APP_BASE} from './lib/paths';
import './app.css';import './world.css';import './social.css';
const queryClient=new QueryClient({defaultOptions:{queries:{retry:1},mutations:{retry:false}}});
const hashPreview=import.meta.env.VITE_ROUTER_MODE==='hash';const Router=hashPreview?HashRouter:BrowserRouter;
class ErrorBoundary extends Component<{children:ReactNode},{failed:boolean}>{state={failed:false};static getDerivedStateFromError(){return {failed:true};}componentDidCatch(error:Error,_info:ErrorInfo){console.error('LifeCity render error',error.name);}render(){return this.state.failed?<main className="app-loading"><h1>تعذّر فتح هذه المساحة · Unable to load</h1><p>تقدّم الحساب محفوظ في الخدمة بعد نجاح الحفظ. · Successfully saved account progress stays with the service.</p><button onClick={()=>location.reload()}>إعادة التحميل · Reload</button></main>:this.props.children;}}
createRoot(document.getElementById('root')!).render(<StrictMode><ErrorBoundary><QueryClientProvider client={queryClient}><LocaleProvider><GameProvider><Router basename={hashPreview||APP_BASE==='/'?'/':APP_BASE.replace(/\/$/,'')}><App/></Router></GameProvider></LocaleProvider></QueryClientProvider></ErrorBoundary></StrictMode>);
