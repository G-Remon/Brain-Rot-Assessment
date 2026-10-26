import {useEffect,useRef,useState} from 'react'
import {ArrowLeft,BookOpen,HelpCircle,X} from 'lucide-react'
import {SectionHelp} from './UserGuide'
import {toolGuides,type ToolGuideId} from './user-guidance'
import type {AppScreen} from './app-routing'
import './guide-dock.css'
const pageHelp:Partial<Record<AppScreen,{title:string;purpose:string;steps:readonly string[];finish:string}>>={
 results:{title:'قراءة النتيجة',purpose:'الدرجة وتفصيل المحاور ظاهرين في أول الصفحة. الدرجة الأقل تعني صعوبات أقل في إجاباتك، مش قدرة أقل.',steps:['المجموع من 120، وكل محور من 20. دي مؤشرات من إجاباتك، مش درجات نجاح ورسوب.','6/20 بتوصف صعوبات أقل من 16/20؛ الرقم مش نسبة تركيز أو ذكاء. بص على كل محور لوحده حتى لو المجموع قليل.','ابدأ بخطوة واحدة من خطة الـ14 يوم. التحليل المطوّل والكتب اختياريين.'],finish:'فتح النتيجة أو قراءة الإرشادات مش بيغيّر إجاباتك أو يحفظ نسخة منها.'},
 journey:{title:'خطة الـ14 يوم',purpose:'الخطة بترتّب خطوات من إجاباتك حسب الوقت المناسب ليك.',steps:['كمّل الاختبار، وبعدها اختار المسار والوقت والسياق وابدأ الخطة.','افتح اليوم الأول، واقرأ المهمة وطبّقها فعلًا.','سجّل إتمام اليوم واحفظ ملاحظتك لو حابب، وبعدها ارجع للخطوة التالية.'],finish:'يوم واحد وخطوة صغيرة كفاية كبداية.'},
 library:{title:'مكتبة التمارين',purpose:'اختار تمرينًا حسب احتياجك؛ خطة الـ14 يوم تقدر ترتّب الخطوات ليك.',steps:['اختار المجال أو فعّل «المناسب لإجاباتي فقط» لو كملت الاختبار.','افتح «الخطوات وطريقة القياس»، وجرّب المستوى البسيط من تمرين واحد.','لاحظ اللي حصل، وبعدها جرّب التعمّق لما تكون جاهز.'],finish:'التطبيق خارج الموقع؛ فتح التمرين مش تسجيل إنجاز.'},
 account:{title:'حسابي',purpose:'هنا اسمك وسجل النتائج اللي اخترت تحفظها.',steps:['لو حابب ترجع للنتيجة بعدين، اختار حفظ نتيجتك الحالية.','افتح نتيجة من السجل لقراءة تحليلها أو قارن النتائج الموجودة.','استخدم تعديل الاسم لتغيير اسمك الظاهر. الخطة والأدوات محفوظين بشكل مستقل عن سجل الاختبارات.'],finish:'حفظ نسخة من النتيجة اختياري؛ إكمال الاختبار لوحده مش بيضيف نسخة للسجل.'},
 quiz:{title:'الإجابة على الاختبار',purpose:'جاوب عن اللي حصل فعلًا خلال آخر 14 يوم.',steps:['اختار أقرب إجابة ليك من «أبدًا» إلى «دايمًا».','اضغط «التالي» بعد اختيار الإجابة؛ تقدر ترجع للسؤال السابق.','بعد السؤال الأخير، اضغط «شوف نتيجتك» لعرض الدرجة والتحليل.'],finish:'مفيش إجابات صح وغلط، ومش مطلوب تختار الصورة المثالية.'}
}
export function GuideDock({screen,onGuide}:{screen:AppScreen;onGuide:()=>void}){
 const [open,setOpen]=useState(false),dialog=useRef<HTMLDialogElement>(null)
 useEffect(()=>{setOpen(false)},[screen])
 useEffect(()=>{const element=dialog.current;if(open&&!element?.open)element?.showModal();else if(!open&&element?.open)element.close()},[open])
 const help=pageHelp[screen]
 if(screen==='guide'||screen==='auth')return null
 return <><button className="guide-launcher" aria-label="افتح الإرشادات" aria-haspopup="dialog" aria-expanded={open} onClick={()=>setOpen(true)}><HelpCircle size={23}/><span>إرشادات</span></button><dialog className="guide-dialog" ref={dialog} aria-labelledby="guide-dialog-title" onCancel={()=>setOpen(false)} onClose={()=>setOpen(false)}><header><div><span>مساعدة وقت ما تحتاجها</span><h2 id="guide-dialog-title"><BookOpen size={21}/>إرشادات الاستخدام</h2></div><button className="guide-dialog-close" aria-label="إغلاق الإرشادات" onClick={()=>setOpen(false)}><X size={20}/></button></header>{screen==='tools'?<div><p>اختار شرح الأداة اللي بتستخدمها. مش مطلوب تستخدم كل الأدوات.</p>{(Object.keys(toolGuides) as ToolGuideId[]).map(panel=><SectionHelp key={panel} {...toolGuides[panel]}/>)}</div>:help?<div className="guide-dialog-reading"><h3>{help.title}</h3><p>{help.purpose}</p><ol>{help.steps.map(step=><li key={step}>{step}</li>)}</ol><p className="guide-dialog-note">{help.finish}</p></div>:<div className="guide-dialog-reading"><h3>ابدأ بخطوة واحدة</h3><ol><li>تصفّح الموقع والتمارين براحتك، من غير حساب.</li><li>لما تكون جاهز، ابدأ الاختبار وسجّل دخولك عشان تشوف نتيجتك.</li><li>اقرأ درجتك، وبعدها جرّب يومًا واحدًا من خطتك.</li></ol></div>}<button className="btn btn-primary" onClick={()=>{setOpen(false);onGuide()}}>افتح صفحة الإرشادات كاملة <ArrowLeft size={17}/></button></dialog></>
}
