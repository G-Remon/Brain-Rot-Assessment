import { domains, domainScore, questions, type AnswerMap, type DomainId } from './data.ts'
import { validatedAssessment, snapshotKey } from './assessment-history.ts'

export const journeySources = {
  deep: { title:'Deep Work — Cal Newport', url:'https://calnewport.com/deep-work-rules-for-focused-success-in-a-distracted-world/', kind:'فكرة مستوحاة من كتاب' },
  digital: { title:'Digital Minimalism — Cal Newport', url:'https://calnewport.com/digital-minimalism/', kind:'فكرة مستوحاة من كتاب' },
  atomic: { title:'Atomic Habits — James Clear', url:'https://jamesclear.com/atomic-habits', kind:'فكرة مستوحاة من كتاب' },
  learning: { title:'Dunlosky et al. (2013) · استرجاع ومراجعة متباعدة', url:'https://doi.org/10.1177/1529100612453266', kind:'مراجعة بحثية لاستراتيجيات التعلم' },
  sleep: { title:'CDC · About Sleep', url:'https://www.cdc.gov/sleep/about/index.html', kind:'إرشادات عامة للنوم' },
} as const
export type Exercise = { id:string; domain:DomainId; title:string; description:string; steps:[string,string,string]; tiny:string; measure:string; source:keyof typeof journeySources; questions:string[] }
// Original exercises, not quotations or prescribed treatments. Durations and combinations
// are MindReset editorial choices, not protocols endorsed by the cited authors.
export const exercises:Exercise[] = [
  {id:'focus-space',domain:'focus',title:'مساحة لمهمة واحدة',description:'قلّل المقاطعات اللي تقدر تتحكم فيها قبل ما تبدأ.',steps:['اختار ناتجًا صغيرًا: فقرة، مسألة، أو جزء من شغلك.','حط الموبايل بعيد، وسيب نافذة المهمة بس مفتوحة؛ اسمح بالاتصالات الضرورية.','اشتغل على الجزء المحدد وسجّل عدد المرات اللي خرجت فيها عن المهمة.'],tiny:'دقيقتين على جزء صغير والموبايل بعيد عن إيدك.',measure:'عدد المقاطعات أثناء الجلسة.',source:'deep',questions:['f1','f3','f5']},
  {id:'focus-parking',domain:'focus',title:'ورقة للمشتتات',description:'خلي الفكرة الجانبية تستناك بدل ما تفتح لها تطبيق.',steps:['حط ورقة جنبك واكتب المهمة الحالية في أولها.','كل ما تحب تفتح حاجة جانبية، اكتبها بكلمتين وارجع للمهمة.','بعد الجلسة راجع الورقة واختار الضروري فقط.'],tiny:'اكتب مشتتًا واحدًا وارجع للسطر اللي كنت فيه.',measure:'عدد الرغبات اللي سجلتها بدل تنفيذها فورًا.',source:'deep',questions:['f1','f3','f4']},
  {id:'focus-ritual',domain:'focus',title:'ميعاد ثابت للبداية',description:'اربط البداية بإشارة بسيطة في يومك.',steps:['اختار إشارة موجودة فعلًا: بعد الفطار أو بعد ما تفتح اللابتوب.','جهّز المهمة من قبلها واكتب: بعد الإشارة هبدأ في الجزء ده.','نفّذ الجلسة وسجّل هل بدأت في الوقت اللي اخترته.'],tiny:'افتح الملف وحدد أول خطوة بعد إشارتك اليومية.',measure:'بدأت بعد الإشارة؟ نعم أو لا.',source:'atomic',questions:['f3','f5','i1']},
  {id:'focus-output',domain:'focus',title:'ناتج بدل وقت بس',description:'خلي نهاية الجلسة حاجة ملموسة حتى لو صغيرة.',steps:['اكتب ناتجًا واحدًا تقدر تراجعه بعد الجلسة.','اشتغل عليه من غير إضافة مهمة تانية في النص.','راجع اللي اتعمل واكتب أول خطوة للجلسة الجاية.'],tiny:'اكتب سطرًا أو حل خطوة واحدة.',measure:'إيه الناتج اللي خلصته فعلًا؟',source:'deep',questions:['f2','f4','f5']},
  {id:'scroll-trigger',domain:'scroll',title:'افهم لحظة الفتح',description:'لاحظ إيه اللي بيسبق التصفح التلقائي.',steps:['في أول رغبة للتصفح، قف لحظة واسأل: داخل أعمل إيه؟','اكتب الموقف والإحساس: فراغ، ضغط، أو احتياج حقيقي.','لو مفيش هدف، جرّب نشاطًا صغيرًا تختاره بإرادتك وسجّل اللي حصل.'],tiny:'لاحظ مرة واحدة من غير ما تحكم على نفسك.',measure:'عدد مرات الفتح اللي كان ليها هدف واضح.',source:'atomic',questions:['s2','s4','s5']},
  {id:'scroll-friction',domain:'scroll',title:'غيّر طريق الوصول',description:'قلّل سهولة الوصول للتطبيق اللي بيفتح تلقائيًا.',steps:['اختار تطبيقًا واحدًا بتفتحه كتير من غير هدف.','شيل اختصاره من الشاشة الرئيسية واقفل إشعاراته غير المهمة.','لاحظ خلال اليوم هل التغيير سهّل عليك الاختيار.'],tiny:'انقل تطبيقًا واحدًا من الشاشة الرئيسية.',measure:'مرات فتح التطبيق من تقرير وقت الشاشة إن متاح.',source:'atomic',questions:['s3','s4','s5']},
  {id:'scroll-window',domain:'scroll',title:'ترفيه له بداية ونهاية',description:'حدد وقتًا مناسبًا للترفيه بدل المنع الشامل.',steps:['اختار فترة ترفيه تناسب مسؤولياتك.','حدد نهاية واضحة واستخدم مؤقتًا لو مفيد ليك.','وقت النهاية اقفل وراجع: هل الوقت كان مناسبًا ولا محتاج تعديل؟'],tiny:'حدد نهاية جلسة واحدة قبل ما تبدأها.',measure:'الوقت المخطط مقارنة بالوقت الفعلي.',source:'digital',questions:['s1','s2','s3']},
  {id:'scroll-value',domain:'scroll',title:'التطبيق بيخدم إيه؟',description:'احتفظ بالفايدة وقلّل الجزء اللي بياخد وقتك.',steps:['اختار تطبيقًا واكتب الفايدة اللي محتاجها منه.','جرّب الدخول لغرض محدد مباشرة بدل صفحة الاقتراحات.','اقفل بعد الغرض ودوّن هل خلصته.'],tiny:'حدد سببًا واحدًا قبل فتح التطبيق.',measure:'حققت غرض الزيارة؟ نعم أو لا.',source:'digital',questions:['s1','s4','s5']},
  {id:'patience-wait',domain:'patience',title:'دقيقة انتظار باختيارك',description:'جرّب فترة قصيرة من غير تصفح مستمر.',steps:['اختار انتظارًا آمنًا في يومك، بعيدًا عن القيادة أو المهام الخطرة.','سيب الشاشة مقفولة فترة قصيرة ولاحظ إحساسك من غير إجبار.','بعدها اكتب هل الرغبة في التصفح زادت أو قلت أو فضلت زي ما هي.'],tiny:'دقيقة واحدة من غير تصفح، وتقدر توقف لو مش مرتاح.',measure:'درجة الرغبة قبل وبعد من 1 إلى 5.',source:'digital',questions:['p1','p3','p5']},
  {id:'patience-read',domain:'patience',title:'جزء بطيء يستاهل',description:'اختار محتوى على حسب قيمته، مش سرعته بس.',steps:['اختار فقرة أو جزءًا من شرح يهمك فعلًا.','حدد سؤالًا عايز تلاقي إجابته وكمّل الجزء بهدوء.','اكتب الفكرة اللي استفدتها قبل ما تقرر تكمل أو توقف.'],tiny:'فقرة واحدة وسؤال واحد عنها.',measure:'قدرت تذكر فكرة من الجزء اللي كملته؟',source:'deep',questions:['p2','p4','f2']},
  {id:'patience-offline',domain:'patience',title:'راحة من غير تمرير',description:'جهّز بديلًا بسيطًا لوقت الفراغ.',steps:['اختار راحة بتحبها: مشروب، رسم، أو مشي مناسب لقدرتك.','جرّبها في وقت كنت غالبًا هتفتح فيه الشاشة.','راجع هل الراحة كانت مناسبة، وعدّل البديل لو لأ.'],tiny:'حضّر بديل راحة واحد سهل الوصول له.',measure:'إحساسك بعد الراحة: أريح، زي ما هو، أو أقل راحة.',source:'digital',questions:['p3','p5','s2']},
  {id:'patience-small',domain:'patience',title:'خطوة لنتيجة بعيدة',description:'قسّم المهمة اللي نتيجتها لسه بعيدة.',steps:['اختار هدفًا طويلًا واكتب أول جزء صغير منه.','اشتغل على الجزء في وقتك المحدد من غير مطالبة نفسك بالنهاية كلها.','سجّل الخطوة اللي خلصتها وحدد الخطوة التالية.'],tiny:'حوّل هدفًا كبيرًا لخطوة واحدة مدتها دقيقتين.',measure:'عدد الخطوات الصغيرة المكتملة.',source:'atomic',questions:['p2','p4','i5']},
  {id:'memory-recall',domain:'memory',title:'استرجع قبل ما تراجع',description:'اختبر فهمك من غير المصدر وبعدين صحّح.',steps:['اختار جزءًا صغيرًا من مادة بتتعلمها أو مستند في شغلك.','اقفل المصدر واكتب 3 نقاط من ذاكرتك.','افتح المصدر، صحّح الناقص، وحدد نقطة تراجعها بعد يوم.'],tiny:'سؤال واحد من الذاكرة ثم تصحيح الإجابة.',measure:'عدد النقاط الصحيحة قبل التصحيح.',source:'learning',questions:['m1','m2','f4']},
  {id:'memory-space',domain:'memory',title:'راجع على فترات',description:'ارجع للمعلومة في أيام مختلفة بدل تكرارها مرة واحدة.',steps:['اختار 3 أسئلة من درس أو مهارة سبق تعلمها.','جاوب من غير المصدر وبعدين راجع التصحيح.','رتّب مراجعة تانية بعد يوم ثم بعد أيام؛ عدّل الفترة حسب صعوبة المعلومة.'],tiny:'راجع سؤالًا قديمًا واحدًا.',measure:'عدد الإجابات الصحيحة قبل فتح المصدر.',source:'learning',questions:['m1','m3','m5']},
  {id:'memory-explain',domain:'memory',title:'اشرح بكلامك',description:'حوّل الفكرة لشرح قصير تقدر تراجعه.',steps:['اختار فكرة واحدة بدل موضوع كامل.','اشرحها بترتيب: الفكرة، مثال، إمتى تستخدمها.','راجع المصدر لاكتشاف الخطأ أو الجزء اللي محتاج فهم أكتر.'],tiny:'اشرح فكرة في جملتين وراجع صحتها.',measure:'جزء واحد اكتشفت إنك محتاج توضحه.',source:'learning',questions:['m2','m4','m5']},
  {id:'memory-apply',domain:'memory',title:'طبّق اللي اتعلمته',description:'اختبر الفهم في مسألة أو استخدام حقيقي.',steps:['اختار مهارة واحدة وسؤالًا أو مثالًا صغيرًا ليها.','حاول الحل من غير نسخ مباشر، وارجع للمصدر عند الحاجة.','قارن المحاولة بالحل وسجّل خطأ واحدًا اتعلمت منه.'],tiny:'خطوة واحدة من تمرين صغير.',measure:'قدرت تطبق من غير نسخ إيه؟',source:'learning',questions:['m3','m4','m5']},
  {id:'sleep-observe',domain:'sleep',title:'سجّل روتينك',description:'افصل الملاحظة عن افتراض السبب.',steps:['سجّل وقت النوم والاستيقاظ التقريبيين من الليلة السابقة.','دوّن وقت آخر تصفح وإحساسك بالطاقة صباحًا.','كرر الملاحظة من غير اعتبار يوم واحد دليلًا على السبب.'],tiny:'اكتب وقت نومك واستيقاظك بس.',measure:'وقت النوم والاستيقاظ والطاقة من 1 إلى 5.',source:'sleep',questions:['n1','n3','n4']},
  {id:'sleep-phone',domain:'sleep',title:'الموبايل له مكان تاني',description:'خلّي نهاية التصفح أسهل لما تحب تنام.',steps:['اختار مكان شحن بعيدًا عن السرير مع بقاء وسيلة للطوارئ.','جهّز المنبه أو أي احتياج ضروري قبل ما تبعد الهاتف.','جرّب ليلة وراجع هل رجعت للتصفح بعد ما قررت تنام.'],tiny:'اختار مكان الشحن قبل ما تدخل السرير.',measure:'رجعت للتصفح بعد قرار النوم؟',source:'sleep',questions:['n2','n5']},
  {id:'sleep-winddown',domain:'sleep',title:'نهاية أهدى لليوم',description:'جهّز انتقالًا بسيطًا من الشاشة للراحة.',steps:['حدد وقتًا واقعيًا لإنهاء المحتوى الترفيهي قبل النوم.','اختار نشاطًا هاديًا قصيرًا يناسبك بدل الشاشة.','سجّل اللي حصل وعدّل التوقيت حسب ظروفك من غير إجبار على النوم.'],tiny:'دقيقتين تجهيز لروتين هادي.',measure:'وقت نهاية التصفح الفعلي.',source:'sleep',questions:['n1','n2','n5']},
  {id:'sleep-rhythm',domain:'sleep',title:'روتين يناسب ظروفك',description:'لاحظ انتظام مواعيدك من غير تقليل وقت الراحة.',steps:['راجع مواعيد الأسبوع واختار وقت استيقاظ واقعيًا إن أمكن.','سيب فرصة كفاية للنوم، وعدّل الروتين لو عندك شيفتات.','دوّن الفرق بين الميعاد اللي خططت له والميعاد الفعلي.'],tiny:'راجع ميعاد بكرة وجهّز فرصة مناسبة للراحة.',measure:'انتظام الميعاد وإحساسك بالطاقة.',source:'sleep',questions:['n1','n4','n5']},
  {id:'impact-start',domain:'impact',title:'أول خطوة قبل التصفح',description:'احمِ بداية مسؤولية واحدة في يومك.',steps:['اختار مسؤولية بتتأجل واكتب أصغر خطوة فيها.','حدد وقت بداية واعمل الخطوة قبل فتح الترفيه.','سجّل اللي اتعمل؛ الترفيه والراحة يفضلوا جزءًا طبيعيًا من اليوم.'],tiny:'دقيقتين من أول خطوة فقط.',measure:'بدأت المسؤولية اللي كنت مأجلها؟',source:'atomic',questions:['i1','i5','f3']},
  {id:'impact-pressure',domain:'impact',title:'سمّي الضغط واختر ردًا',description:'اعرف احتياجك قبل ما يكون التصفح هو الرد التلقائي.',steps:['في موقف ضغط عادي، اكتب إيه اللي شاغلك من غير تفاصيل حساسة.','اختار ردًا مناسبًا: راحة، خطوة لحل المشكلة، أو كلام مع شخص تثق فيه.','جرب الرد وراجع هل ساعد؛ لو الضغط مستمر ومؤثر اطلب دعمًا مناسبًا.'],tiny:'سمّي إحساسك واختار خطوة دعم واحدة.',measure:'الخطوة اللي جرّبتها وهل كانت مفيدة.',source:'digital',questions:['i2','i4']},
  {id:'impact-people',domain:'impact',title:'وقت حاضر مع الناس',description:'اتفق على مساحة قصيرة من غير مقاطعات غير ضرورية.',steps:['اختار وجبة أو لقاء قصير واتفق مع الموجودين لو مناسب.','حط الموبايل بعيد مع إتاحة الاتصال الضروري.','راجع هل كنت حاضرًا أكتر وهل الاتفاق مناسب يتكرر.'],tiny:'دقيقتين تستمع فيهم من غير شاشة.',measure:'عدد المقاطعات غير الضرورية في اللقاء.',source:'digital',questions:['i3','i4']},
  {id:'impact-week',domain:'impact',title:'هدف واقعي للأسبوع',description:'اختار هدفًا واحدًا مرتبطًا بحياتك الفعلية.',steps:['اكتب ناتجًا صغيرًا للدراسة أو الشغل أو حياتك الشخصية.','قسمه لخطوات وحدد وقتًا لواحدة منها.','راجع ما اتنفذ وما عطّلك وعدّل الخطة بدل لوم نفسك.'],tiny:'اكتب هدفًا واحدًا وأصغر خطوة له.',measure:'خطوة مكتملة نحو الهدف اللي اخترته.',source:'atomic',questions:['i1','i4','i5']},
]
export const tracks = [
  {id:'focus',title:'تركيز لمهمة واحدة',description:'جلسات واضحة ومقاطعات أقل.',domains:['focus','impact']},
  {id:'scroll',title:'تصفح باختيارك',description:'فهم المحفزات وحدود تناسب يومك.',domains:['scroll','patience']},
  {id:'patience',title:'مساحة للهدوء والصبر',description:'تدرج مريح في الأنشطة الأقل سرعة.',domains:['patience','scroll']},
  {id:'learning',title:'تعلّم يثبت معاك',description:'استرجاع ومراجعة وتطبيق.',domains:['memory','focus']},
  {id:'sleep',title:'روتين أهدى للنوم',description:'ملاحظة الروتين وتجهيز نهاية اليوم.',domains:['sleep','scroll']},
  {id:'impact',title:'ارجع لأولويات يومك',description:'خطوات صغيرة للمسؤوليات والعلاقات.',domains:['impact','focus']},
  {id:'sleep-focus',title:'نوم وتركيز مع بعض',description:'مساران متزامنان من غير افتراض إن واحد سبب التاني.',domains:['sleep','focus']},
  {id:'study',title:'فهم أعمق وتشتت أقل',description:'لما صعوبة الاستيعاب والتركيز يظهروا مع بعض.',domains:['memory','focus']},
  {id:'gentle',title:'بداية خفيفة ومتوازنة',description:'لما الصعوبات تظهر في محاور كتير؛ نبدأ بأعلى أولويتين.',domains:[]},
  {id:'maintain',title:'ثبّت اللي شغال',description:'للمؤشرات القليلة: تحسين اختياري من غير اختراع مشكلة.',domains:['focus','memory']},
] as const
export type TrackId = typeof tracks[number]['id']
export type PlanConfig = { track:TrackId|'auto'; minutes:10|20|30; context:'study'|'work'|'general' }
export const defaultConfig:PlanConfig={track:'auto',minutes:10,context:'general'}
export const contextLabels={study:'دراسة وتعلّم',work:'شغل ومشروعات',general:'يومي بشكل عام'}
export function rankDomains(answers:AnswerMap) {
  return domains.map(d=>({...d,score:domainScore(answers,d.id)})).sort((a,b)=>b.score-a.score || (a.id==='impact'?-1:b.id==='impact'?1:0))
}
export function recommendTrack(answers:AnswerMap):TrackId {
  const ranked=rankDomains(answers)
  if(questions.every(q=>answers[q.id]<=1)) return 'maintain'
  if(ranked.filter(d=>d.score>=10).length>=4) return 'gentle'
  // Combined paths are selected only when both domains are near the top.
  const top=new Set(ranked.filter(d=>d.score>=8 && d.score>=ranked[0].score-3).map(d=>d.id))
  if(top.has('sleep') && top.has('focus')) return 'sleep-focus'
  if(top.has('memory') && top.has('focus')) return 'study'
  const peak=questions.filter(q=>answers[q.id]>=2).sort((a,b)=>(answers[b.id]-answers[a.id]) || (a.domain==='impact'?-1:b.domain==='impact'?1:questions.indexOf(a)-questions.indexOf(b)))[0]
  const lead=ranked[0].score<=3 && peak ? peak.domain : ranked[0].id
  return lead==='memory'?'learning':lead
}
export function selectedDomains(answers:AnswerMap,track:TrackId):DomainId[] {
  return track==='gentle'?rankDomains(answers).slice(0,2).map(d=>d.id):[...tracks.find(t=>t.id===track)!.domains] as DomainId[]
}
export function matchingExercises(answers:AnswerMap,domain:DomainId) {
  const relevance=(e:Exercise)=>e.questions.filter(id=>answers[id]>=2).reduce((sum,id)=>sum+answers[id],0)
  return exercises.filter(e=>e.domain===domain).sort((a,b)=>relevance(b)-relevance(a))
}
export type JourneyDay={day:number;title:string;minutes:number;steps:string[];tiny:string;measure:string;exerciseId?:string;source?:keyof typeof journeySources;phase:string}
export function buildJourney(answers:AnswerMap,config:PlanConfig):{track:TrackId;reason:string;days:JourneyDay[]} {
  if(!validatedAssessment(answers)) throw new Error('assessment-incomplete')
  const track=config.track==='auto'?recommendTrack(answers):config.track
  const selected=selectedDomains(answers,track)
  const ranked=rankDomains(answers)
  const reason=track==='maintain'?'إجاباتك قليلة التكرار في كل المحاور؛ ده مسار تثبيت اختياري.':
    track==='gentle'?'أربع محاور أو أكتر وصلت إلى 10/20؛ بنقلّل الحمل ونبدأ بأولويتين فقط.':
    `التركيز هنا على ${selected.map(id=>domains.find(d=>d.id===id)!.short).join(' و')}؛ أعلى محور عندك ${ranked[0].title} (${ranked[0].score}/20). ${config.track==='auto'?'الاختيار من درجات المحاور والإجابات المتكررة.':'ده اختيارك اليدوي، وتقدر ترجع للترشيح التلقائي.'}`
  const activityDays=[2,3,4,5,6,8,9,10,11,12,13]
  const counts:Partial<Record<DomainId,number>>={}
  const days:JourneyDay[]=Array.from({length:14},(_,i)=>{
    const day=i+1
    const phase=day<=3?'نلاحظ ونبدأ':day<=6?'نجرب':day===7?'نراجع':day<=10?'نثبّت':day<=13?'نطبّق':'نقارن'
    if(day===1)return {day,phase,title:'نقطة البداية',minutes:Math.min(config.minutes,10),steps:[`اختار موقفًا واحدًا يخص ${domains.find(d=>d.id===selected[0])!.short} وسجّل إيه اللي بيحصل فعلًا.`,`حدد ميعادًا واقعيًا لخطوة يومية تناسب ${contextLabels[config.context]}.`,'سجّل قياس البداية اللي يهمك: مقاطعات، وقت تصفح، أو استرجاع معلومة.'],tiny:'سجّل موقفًا واحدًا من يومك.',measure:'ملاحظة البداية اللي هتقارن بيها.'}
    if(day===7||day===14)return {day,phase,title:day===7?'وقفة مراجعة الأسبوع':'راجع التجربة واختار اللي يستمر',minutes:Math.min(config.minutes,10),steps:day===7?['راجع الأيام اللي جرّبتها وملاحظاتك، حتى لو مش كلها مكتملة.','اختار خطوة نفعتك وخطوة كانت تقيلة؛ استخدم النسخة الخفيفة لما تحتاج.','قارن قياسك بملاحظة البداية، وعدّل التوقيت الأسبوع الجاي.']:['قارن ملاحظاتك بنقطة البداية: إيه اتحسن، وإيه ثابت، وإيه محتاج تعديل؟','اختار عادة واحدة تكملها في الأسبوع الجاي؛ مفيش تحسن مضمون خلال 14 يوم.','ممكن تعيد نفس الاستبيان وتقارن إجاباتك؛ التغير وصفي ومش مقياسًا طبيًا.'],tiny:'اكتب حاجة نفعتك وحاجة هتعدلها.',measure:'فرق في مقياسك العملي، مش رقم الاستبيان بس.'}
    const activity=activityDays.indexOf(day)
    const domain=selected[activity%selected.length]
    const count=counts[domain]??0;counts[domain]=count+1
    const exercise=matchingExercises(answers,domain)[count%4]
    const minutes=track==='gentle'&&day<=6?Math.min(config.minutes,10):config.minutes
    const context=config.context==='study'?'لو الخطوة فيها مهمة أو محتوى، اختار جزءًا من دراستك.':config.context==='work'?'لو الخطوة فيها مهمة أو محتوى، اختار جزءًا من شغلك.':'اختار موقفًا حقيقيًا من يومك يناسب الخطوة.'
    return {day,phase,title:(count>=4?'ثبّت التجربة: ':'')+exercise.title,minutes,steps:[...exercise.steps,context,`خلّي التطبيق جوه ${Math.max(2,minutes-2)} دقايق قدر الإمكان، ودقيقتين للملاحظة؛ خطوات النوم تتجهّز دلوقتي وتتلاحظ بالليل.`],tiny:exercise.tiny,measure:exercise.measure,source:exercise.source,exerciseId:exercise.id}
  })
  return {track,reason,days}
}
export type PlanRecord={version:1;answers:AnswerMap;assessment_key:string;config:PlanConfig;started_on:string;completed_days:number[];notes:Record<string,string>}
export function localDate(date=new Date()) {return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`}
export function validatePlan(value:unknown):PlanRecord|null {
  if(!value||typeof value!=='object')return null
  const p=value as PlanRecord
  if(p.version!==1||!validatedAssessment(p.answers)||p.assessment_key!==snapshotKey(p.answers))return null
  if(!p.config||!['auto',...tracks.map(t=>t.id)].includes(p.config.track)||![10,20,30].includes(p.config.minutes)||!['study','work','general'].includes(p.config.context))return null
  if(typeof p.started_on!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(p.started_on)||Number.isNaN(Date.parse(p.started_on))||localDate(new Date(p.started_on+'T12:00:00'))!==p.started_on)return null
  if(!Array.isArray(p.completed_days)||new Set(p.completed_days).size!==p.completed_days.length||!p.completed_days.every(d=>Number.isInteger(d)&&d>=1&&d<=14))return null
  if(!p.notes||typeof p.notes!=='object'||Array.isArray(p.notes)||!Object.entries(p.notes).every(([key,note])=>/^(?:[1-9]|1[0-4])$/.test(key)&&typeof note==='string'&&note.length<=500))return null
  return {version:1,answers:validatedAssessment(p.answers)!,assessment_key:p.assessment_key,config:{track:p.config.track,minutes:p.config.minutes,context:p.config.context},started_on:p.started_on,completed_days:[...p.completed_days],notes:{...p.notes}}
}
export function planDayDate(start:string,day:number) {const date=new Date(start+'T12:00:00');date.setDate(date.getDate()+day-1);return localDate(date)}
export function nextPlanDay(p:PlanRecord) {return Array.from({length:14},(_,i)=>i+1).find(day=>!p.completed_days.includes(day))??14}
