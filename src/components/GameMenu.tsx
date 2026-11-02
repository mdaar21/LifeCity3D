import {Link,useNavigate} from 'react-router-dom';
import {Building2,ChevronLeft,ChevronRight,Coins,Heart,House,LayoutDashboard,MoonStar,Settings,Share2,TrendingUp,Wrench} from 'lucide-react';
import {useLocale} from '../lib/locale';
import {closeCityPanels} from '../world/city-tools';
import {useWorldUI} from '../world/useWorldUI';

/** Secondary destinations have one home, grouped by the player's intention. */
export function GameMenu({onClose,onVisits}:{onClose:()=>void;onVisits:()=>void}){
 const {t,language}=useLocale(),navigate=useNavigate(),Arrow=language==='ar-SA'?ChevronLeft:ChevronRight;
 const openTools=(tab:'build'|'residents')=>{onClose();closeCityPanels(true);navigate('/city');useWorldUI.getState().set({open:true,tab,ghost:null,replay:null});};
 const groups=[
  {key:'city',title:t('مدينتك','Your city'),items:[
   {key:'tools',title:t('أدوات المدينة','City tools'),detail:t('المباني والشخصية وإعدادات العالم','Buildings, character & world settings'),icon:Wrench,action:()=>openTools('build')},
   {key:'information',title:t('معلومات المدينة','City information'),detail:t('السكان والأحياء والخدمات','Residents, districts & services'),icon:Building2,action:()=>openTools('residents')},
   {key:'interior',title:t('داخل المنزل','Home interior'),detail:t('ترتيب الغرف والأثاث المملوك','Arrange rooms and owned furniture'),icon:House,path:'/interior'},
   {key:'visits',title:t('زيارات المدينة','City visits'),detail:t('المشاركة وإدارة رابط الزيارة','Sharing and visit link management'),icon:Share2,action:onVisits},
  ]},
  {key:'progress',title:t('تقدّمك','Your progress'),items:[
   {key:'journey',title:t('سجل الرحلة','Journey log'),detail:t('يومك وخطوتك القادمة','Your day and next step'),icon:LayoutDashboard,path:'/dashboard'},
   {key:'prayers',title:t('الصلوات','Prayers'),detail:t('سجلّك اليومي والمراجعة','Daily journal and corrections'),icon:MoonStar,path:'/prayers'},
   {key:'stats',title:t('إنجازاتي','Achievements'),detail:t('الإحصاءات وسجل المكافآت','Statistics and reward history'),icon:TrendingUp,path:'/stats'},
  ]},
  {key:'account',title:t('حسابك','Your account'),items:[
   {key:'wallets',title:t('المحفظتان والعملات','Wallets & currencies'),detail:t('الرصيد الرئيسي ودرهم ويوي','Main balance and Yuyi MAD'),icon:Coins,path:'/economy'},
   {key:'yuyi',title:t('ويوي','Yuyi'),detail:t('مساحتك المشتركة وصلاحياتها','Your shared space and permissions'),icon:Heart,path:'/yuyi'},
   {key:'settings',title:t('الإعدادات','Settings'),detail:t('الحساب واللغة وجودة العرض','Account, language & graphics'),icon:Settings,path:'/settings'},
  ]},
 ];
 return <div className="game-menu-sections">{groups.map(group=><section className={'menu-section menu-section-'+group.key} key={group.key} aria-labelledby={'menu-'+group.key}><h3 id={'menu-'+group.key}>{group.title}</h3><div className="menu-section-items">{group.items.map(item=>{const Icon=item.icon,content=<><span className="menu-row-icon"><Icon size={21}/></span><span className="menu-row-copy"><strong>{item.title}</strong><small>{item.detail}</small></span><Arrow size={16} aria-hidden="true"/></>;return 'path' in item?<Link className="game-menu-row" key={item.key} to={item.path!} onClick={onClose}>{content}</Link>:<button className="game-menu-row" data-testid={item.key==='tools'?'world-studio':undefined} key={item.key} onClick={item.action}>{content}</button>;})}</div></section>)}</div>;
}
