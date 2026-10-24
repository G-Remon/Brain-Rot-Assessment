import { domains, domainScore, options, questions, type AnswerMap, type DomainId } from './data'

type Guide = {
  title: string
  signal: string
  nextStep: string
  strength: string
  sourceId: 'apa' | 'who' | 'cdc' | 'dunlosky'
}

export const questionGuides: Record<string, Guide> = {
  f1: {title:'مسك الموبايل وسط الشغل',signal:'بتقول إن الموبايل أحيانًا بيقطع المهمة حتى من غير إشعار.',nextStep:'حط الموبايل بعيد عن متناول إيدك خلال أول 20 دقيقة من المهمة، وسجّل المقاطعات.',strength:'بتعرف تفصل بين الموبايل والمهام في أغلب الوقت.',sourceId:'apa'},
  f2: {title:'متابعة الشرح الطويل',signal:'استكمال شرح طويل من غير تغيير نشاط بيكون صعب عليك بعض الوقت.',nextStep:'قسّم الشرح لأجزاء 10–15 دقيقة، واكتب فكرة واحدة بعد كل جزء قبل ما تكمل.',strength:'بتقدر تتابع الشرح الطويل من غير تنقل متكرر.',sourceId:'dunlosky'},
  f3: {title:'الرغبة في تغيير التطبيق',signal:'بعد بداية مهمة مهمة بيجيلك ميل تفتح تطبيق تاني.',nextStep:'اكتب على ورقة الحاجة اللي عايز تفتحها، وارجعلها بعد نهاية جلسة التركيز.',strength:'بداية المهمة عندك مش مرتبطة غالبًا بفتح تطبيقات تانية.',sourceId:'apa'},
  f4: {title:'إعادة القراءة بسبب التشتت',signal:'بتعيد بعض الفقرات لأن انتباهك راح لحاجة تانية.',nextStep:'اقرأ فقرة قصيرة واسأل نفسك سؤال عن الفكرة الأساسية قبل اللي بعدها.',strength:'مش بتحتاج كتير تعيد نفس السطور بسبب التشتت.',sourceId:'dunlosky'},
  f5: {title:'الاستمرار 25 دقيقة',signal:'جلسة متصلة مدتها 25 دقيقة بتكون تقيلة عليك أحيانًا.',nextStep:'ابدأ بتركيز 10 دقايق على حاجة واحدة، وزوّد المدة تدريجيًا لو بقيت مريحة.',strength:'غالبًا تقدر تكمل جلسة عمل واحدة على الأقل بشكل متصل.',sourceId:'apa'},
  s1: {title:'الوقت اللي بيضيع في الريلز',signal:'الفيديوهات القصيرة ممكن تخليك تقضي وقت أكتر من اللي كنت ناويه.',nextStep:'حدد قبل الفتح إمتى هتقفل، واستخدم مؤقتًا بسيطًا لو هيساعدك.',strength:'غالبًا بتلاحظ الوقت اللي بتقضيه في المحتوى القصير.',sourceId:'apa'},
  s2: {title:'التقليب من غير استمتاع',signal:'بتكمل تقليب حتى لما المتعة تقل؛ ده سبب مناسب تراجع نمط الاستخدام.',nextStep:'أول ما تلاحظ إنك مش مستمتع، اقفل التطبيق واسأل نفسك كنت محتاج إيه فعلًا.',strength:'بتقدر توقف غالبًا لما المحتوى مبقاش مفيد أو ممتع.',sourceId:'apa'},
  s3: {title:'الالتزام بحد التصفح',signal:'الحد الزمني اللي بتحطه للتصفح مش دايمًا بيمشي زي ما خططت.',nextStep:'خلّي وقت التصفح في فترة محددة من اليوم واختبر هل ده أسهل من حد يومي عام.',strength:'التزامك بالوقت اللي بتحدده لنفسك نقطة قوة.',sourceId:'apa'},
  s4: {title:'الموبايل أول ما تصحى',signal:'الترفيه الرقمي ساعات بيكون أول نشاط تلقائي بعد الاستيقاظ.',nextStep:'اختار نشاطًا بسيطًا يسبق التصفح: مياه، ترتيب السرير، أو تجهيز يومك.',strength:'مش بتبدأ يومك عادةً بتصفح ترفيهي تلقائي.',sourceId:'apa'},
  s5: {title:'إعادة فتح نفس التطبيق',signal:'بتقفل التطبيق وتلاقي نفسك رجعتله بسرعة من غير هدف واضح.',nextStep:'انقل التطبيقات الجاذبة بعيد عن الشاشة الرئيسية، واكتب سبب فتحها قبل الدخول.',strength:'غالبًا بتقفل التطبيقات من غير رجوع تلقائي سريع.',sourceId:'apa'},
  p1: {title:'الانتظار من غير شاشة',signal:'الانتظار الهادي من غير موبايل بيكون مش مريح أحيانًا.',nextStep:'جرّب انتظار 3–5 دقايق من غير تصفح، وشوف هل الإحساس بيتغيّر.',strength:'بتستحمل الانتظار العادي من غير احتياج مستمر للشاشة.',sourceId:'apa'},
  p2: {title:'استعجال النتائج',signal:'الصبر على المهام الطويلة بيقل خصوصًا لما النتيجة تتأخر.',nextStep:'قسّم المهمة الكبيرة إلى خطوة يمكن إنهاؤها في 20 دقيقة، وقِس التقدم بدل النهاية.',strength:'عندك استعداد جيد للمهام اللي نتائجها بتحتاج وقت.',sourceId:'apa'},
  p3: {title:'الهدوء من غير شاشة',signal:'فترة هدوء من غير شاشة أو ترفيه ممكن تضايقك.',nextStep:'خصص 5 دقايق هدوء أو مشي خفيف من غير هاتف، من غير ما تضغط على نفسك.',strength:'بتعرف تقعد بهدوء من غير محتوى مستمر.',sourceId:'apa'},
  p4: {title:'ترك المحتوى البطيء',signal:'أحيانًا بتسيب حاجة مفيدة لأنها بطيئة مش لأنها غير مهمة.',nextStep:'قبل ما توقف الشرح، حدّد الجزء اللي عايز تستفاد منه وكمّله 10 دقايق.',strength:'السرعة أو الإثارة مش السبب الأساسي لاختيارك المحتوى.',sourceId:'dunlosky'},
  p5: {title:'الحاجة للترفيه المستمر',signal:'بتحس إن وجود ترفيه مستمر ضروري عشان ما تملش.',nextStep:'اختار نشاطًا مريحًا غير رقمي لمدة 10 دقايق، من غير اعتبار الراحة مهمة صعبة.',strength:'الملل العادي غالبًا مش بيجبرك على ترفيه مستمر.',sourceId:'apa'},
  m1: {title:'تذكّر ما شاهدته',signal:'بتحس إن التفاصيل اللي شفتها قريب مش بتفضل في ذاكرتك.',nextStep:'بعد المحتوى المهم، اقفل المصدر واكتب 3 نقاط من ذاكرتك، وراجعها بعد يوم.',strength:'بتفتكر عادةً التفاصيل المهمة من المحتوى اللي شفته.',sourceId:'dunlosky'},
  m2: {title:'تلخيص الأفكار الطويلة',signal:'تلخيص موضوع طويل بكلامك ممكن يكون صعب عليك.',nextStep:'اكتب 3 عناوين للفكرة ثم اشرح كل عنوان بجملة من غير ما تبص للمصدر.',strength:'بتقدر تلخّص محتوى طويل بطريقتك غالبًا.',sourceId:'dunlosky'},
  m3: {title:'التنقل بين مواضيع كتير',signal:'بتبدأ مواضيع مختلفة من غير ما تكمل تعلّم واحدة بعمق.',nextStep:'اختار موضوعًا واحدًا تكمله الأسبوع ده وحدد ناتجًا واضحًا: تمرين أو شرح.',strength:'بتدي للموضوع وقتًا كافيًا قبل الانتقال لموضوع آخر.',sourceId:'dunlosky'},
  m4: {title:'ترتيب الأفكار المعقدة',signal:'ترتيب الفكرة الكبيرة عشان تشرحها بيحتاج منك مجهود.',nextStep:'استخدم ترتيب: المشكلة، السبب، مثال، الحل، ثم اشرح بصوتك.',strength:'بتعرف غالبًا ترتّب أفكارك لما تشرح مشكلة كبيرة.',sourceId:'dunlosky'},
  m5: {title:'الملخص بدل المصدر الكامل',signal:'بتختار الملخصات حتى لما الموضوع يستحق فهمًا أعمق.',nextStep:'خد ملخصًا للفكرة العامة، وبعدها ارجع لجزء واحد مهم من المصدر الأصلي.',strength:'بتعرف تختار بين الملخص والتعمق على حسب أهمية الموضوع.',sourceId:'dunlosky'},
  n1: {title:'تأخير النوم بسبب التصفح',signal:'التصفح أحيانًا بياخد من وقت نومك.',nextStep:'جرّب تقفل المحتوى الترفيهي قبل ميعاد النوم بـ30 دقيقة ليلتين.',strength:'مش بتخلّي التصفح يأخر نومك في أغلب الأيام.',sourceId:'cdc'},
  n2: {title:'الموبايل في السرير',signal:'بتلاقي صعوبة توقف استخدام الهاتف وإنت في السرير.',nextStep:'اشحن الموبايل بعيد عن السرير واستخدم منبهًا منفصلًا لو متاح.',strength:'مش بتعتمد على الموبايل في السرير بصورة مزعجة.',sourceId:'cdc'},
  n3: {title:'الإرهاق بعد المحتوى السريع',signal:'بتبلغ عن تعب ذهني بعد فترات محتوى سريع؛ ده مش دليل على سببه الطبي.',nextStep:'راقب مدة المشاهدة ومستوى طاقتك قبلها وبعدها 3 مرات، وشوف النمط.',strength:'مش بتلاحظ إرهاقًا ذهنيًا متكررًا بعد مشاهدة المحتوى.',sourceId:'cdc'},
  n4: {title:'قلة النشاط بعد ليلة تصفح',signal:'بتحس بطاقة أقل الصبح بعد ليالي التصفح.',nextStep:'راقب عدد ساعات النوم، وقت التصفح، والنشاط الصباحي بدل ما تفترض سببًا واحدًا.',strength:'مش بتلاحظ غالبًا هبوط طاقة الصبح بعد التصفح.',sourceId:'cdc'},
  n5: {title:'الاستمرار رغم احتياج النوم',signal:'بتكمل تصفح رغم إنك محتاج ترتاح.',nextStep:'جهّز خطوة إيقاف واضحة: آخر فيديو، قفل التطبيق، وبعده الهاتف بعيد عنك.',strength:'بتقدر غالبًا تختار الراحة بدل التصفح لما تكون مرهق.',sourceId:'cdc'},
  i1: {title:'تأجيل المسؤوليات',signal:'بتقول إن التصفح أحيانًا بيأخر مسؤوليات مهمة.',nextStep:'ابدأ أصعب مهمة 10 دقايق قبل فتح أي تطبيق ترفيهي.',strength:'التصفح نادرًا ما بيأخر واجباتك المهمة.',sourceId:'apa'},
  i2: {title:'التصفح للهروب من الضغط',signal:'بتلجأ للشاشات أحيانًا بدل التعامل مع ضغط أو مشكلة.',nextStep:'سمّي اللي مضايقك واكتب أول خطوة صغيرة للتعامل معاه قبل فتح التطبيق.',strength:'غالبًا عندك بدائل للتعامل مع الضغط غير التصفح.',sourceId:'apa'},
  i3: {title:'الموبايل أثناء الوقت مع الناس',signal:'التليفون أحيانًا بيأخذ جزءًا من وقتك مع ناس مهمين.',nextStep:'جرّب وقتًا قصيرًا في لقاء أو وجبة يكون فيه الموبايل بعيد عنك.',strength:'بتحافظ غالبًا على وجودك مع الناس من غير مقاطعات هاتفية.',sourceId:'apa'},
  i4: {title:'الإحساس بفقدان السيطرة',signal:'ساعات بتحس إن التطبيقات بتتحكم في وقتك بدل ما إنت تختار.',nextStep:'سجّل استخدامك لمدة يوم، وحدد موقفًا واحدًا تحب تغيّر فيه رد فعلك التلقائي.',strength:'بتحس عادةً إنك متحكم في استخدامك للتطبيقات.',sourceId:'apa'},
  i5: {title:'التأثير على أهدافك',signal:'بتربط بين استخدام المحتوى السريع وتأجيل أهداف تهمّك.',nextStep:'حدد هدفًا واحدًا اتأخر، وجدول أول خطوة فيه قبل وقت الترفيه.',strength:'استخدامك الرقمي غالبًا مش بيقف قدام أهدافك.',sourceId:'apa'}
}

export type QuestionReading = {
  id: string
  domain: DomainId
  answer: number
  answerLabel: string
  title: string
  observation: string
  action: string
  sourceId: Guide['sourceId']
  level: 'strength' | 'light' | 'noticeable' | 'frequent'
  weight: number
}

export type DomainReading = {
  id: DomainId
  title: string
  score: number
  label: string
  explanation: string
  positive: boolean
}

export type PatternReading = {
  id: string
  title: string
  description: string
  action: string
  questionIds: string[]
  sourceId: Guide['sourceId']
  score: number
}

export type PersonalAction = {
  id: string
  title: string
  description: string
  reason: string
  questionIds: string[]
  sourceId: Guide['sourceId']
}

export type PlanDay = {
  day: number
  title: string
  task: string
  why: string
}

export type VideoResource = {
  id: string
  title: string
  creator: string
  description: string
  url: string
  domains: DomainId[]
  note: string
}
export const arabicVideos: VideoResource[] = [
  {id:'Lfs9LrpEUf0',title:'لماذا لا نستطيع قراءة الكتب؟ | الدحيح',creator:'New Media Academy Life',description:'طرح ممتع عن صعوبة الاستمرار في القراءة الطويلة. مناسب لو بتحس إن المحتوى البطيء بيتعبك.',url:'https://www.youtube.com/watch?v=Lfs9LrpEUf0',domains:['memory','patience'],note:'محتوى تثقيفي، مش اختبار للذاكرة أو دليل على تلف الدماغ.'},
  {id:'ZVKpTLA1qCY',title:'خطوات لزيادة التركيز أثناء الدراسة والتخلص من إدمان الهاتف',creator:'Dr Muhammad Deyhaa',description:'أفكار عملية لتنظيم وقت المذاكرة والتعامل مع الموبايل وقت التركيز.',url:'https://www.youtube.com/watch?v=ZVKpTLA1qCY',domains:['focus','scroll','impact'],note:'عنوان الفيديو مش وعد إن عادة هتختفي للأبد.'},
  {id:'9CMLAwL8pDo',title:'٧ حلول بسيطة لمشكلة ضعف التركيز وتشتت الانتباه',creator:'الزتونة - El Zatoona',description:'مناقشة لروتين التركيز والتشتت وطرق بسيطة لتنظيم اليوم.',url:'https://www.youtube.com/watch?v=9CMLAwL8pDo',domains:['focus','patience','memory'],note:'بعض تبسيطات الدوبامين أو الفيتامينات في المحتوى مش توصيات طبية؛ متاخدش مكملات لمجرد فيديو.'},
  {id:'hF08Srb19Nk',title:'إدمان الإنترنت: خطر صامت في حياتنا اليومية!',creator:'الطبي - Altibbi',description:'نظرة صحية عامة عن متى الاستخدام الرقمي ممكن يتحول لمشكلة في الحياة اليومية.',url:'https://www.youtube.com/watch?v=hF08Srb19Nk',domains:['impact','scroll','sleep'],note:'المشاهدة للتوعية فقط؛ ساعات الشاشة وحدها لا تكفي لتشخيص اضطراب.'}
]

type PatternRule = Omit<PatternReading,'score'> & {min: Array<[string,number]>}
const patternRules: PatternRule[] = [
  {id:'autopilot',title:'التصفح التلقائي محتاج وقفة صغيرة',description:'إجاباتك عن الاستمرار في التقليب والرجوع للتطبيق بتشير لسلوك بيتكرر؛ مش لازم يكون إدمان.',action:'بدّل أول 5 دقايق فراغ بنشاط محدد، وحط التطبيقات الجاذبة بعيد عن الشاشة الرئيسية.',questionIds:['s2','s5'],sourceId:'apa',min:[['s2',2],['s5',2]]},
  {id:'time-loss',title:'الوقت بيروح من غير قصد',description:'أحيانًا الوقت المخصص للتصفح بيزيد عن اللي كنت ناويه، وفيه صعوبة تلتزم بالحد.',action:'حط بداية ونهاية واضحة لوقت الترفيه وجرب مؤقتًا لمدة 3 أيام.',questionIds:['s1','s3'],sourceId:'apa',min:[['s1',2],['s3',2]]},
  {id:'bedtime',title:'التصفح والنوم بيتداخلوا',description:'بتقول إن التصفح بيأخر نومك وإن قفل الهاتف في السرير صعب أحيانًا.',action:'ابدأ بروتين 30 دقيقة بدون محتوى ترفيهي، مع شحن الموبايل بعيد عن السرير.',questionIds:['n1','n2'],sourceId:'cdc',min:[['n1',2],['n2',2]]},
  {id:'sleep-focus',title:'النوم والتشتت ظهروا مع بعض',description:'إجاباتك عن تأخير النوم والتشتت متزامنة. ده لا يثبت إن واحدة سبب التانية.',action:'قارن جلسة تركيز بعد نوم كافي وجلسة بعد ليلة قليلة النوم، وسجّل الفرق.',questionIds:['n1','f4'],sourceId:'cdc',min:[['n1',2],['f4',2]]},
  {id:'learning',title:'محتاج تثبّت المعلومة مش تكررها بس',description:'بتبلغ عن نسيان تفاصيل وصعوبة تلخيص؛ دي صعوبات ذاتية مش قياس فعلي للذاكرة.',action:'بعد المحتوى اقفله واكتب 3 نقاط، وارجع راجعهم بعد يوم ثم 3 أيام.',questionIds:['m1','m2'],sourceId:'dunlosky',min:[['m1',2],['m2',2]]},
  {id:'surface-learning',title:'ممكن تختار سرعة المحتوى على حساب العمق',description:'صعوبة الاستمرار مع الشرح واختيار الملخصات بيظهروا في إجاباتك.',action:'بعد أي ملخص، افتح مصدرًا أصليًا واحدًا وركز 10 دقائق على أهم فكرة.',questionIds:['f2','m5'],sourceId:'dunlosky',min:[['f2',2],['m5',2]]},
  {id:'avoidance',title:'الموبايل أحيانًا بيبقى وسيلة هروب',description:'ممكن يكون الفراغ أو الضغط بيزود الرغبة في التصفح، حسب إجاباتك.',action:'قبل الموبايل خُد دقيقة واسأل نفسك: أنا زهقان ولا قلقان ولا محتاج راحة؟',questionIds:['i2','p3'],sourceId:'apa',min:[['i2',2],['p3',2]]},
  {id:'postpone',title:'بداية المهمة والإنجاز محتاجين حماية',description:'التصفح بيظهر مع تأجيل مهمة والرغبة في تغيير التطبيق بعد البداية.',action:'اعمل أول 10 دقائق من المهمة قبل فتح تطبيق ترفيهي، واكتب الخطوة الجاية.',questionIds:['i1','f3'],sourceId:'apa',min:[['i1',2],['f3',2]]},
  {id:'deep-time',title:'القفز بين المواضيع بيأثر على التعمق',description:'استعجال النتيجة والتنقل بين مواضيع كتير ظهروا مع بعض.',action:'اختار ناتج تعلم واحد صغير تخلصه خلال الأسبوع بدل فتح مواضيع جديدة.',questionIds:['p2','m3'],sourceId:'dunlosky',min:[['p2',2],['m3',2]]},
  {id:'social-time',title:'وقت الناس ممكن يستفيد من حدود واضحة',description:'الشعور بفقدان السيطرة بيظهر مع الانشغال بالموبايل في اللقاءات.',action:'جرّب وجبة واحدة من غير موبايل، وراجع هل كانت أريح.',questionIds:['i3','i4'],sourceId:'apa',min:[['i3',2],['i4',2]]}
]

const commonActions = [
  {id:'maintain',title:'حافظ على اللي شغال معاك',description:'استمر على عادة رقمية واحدة مفيدة عندك، ومتحطش قيود من غير سبب.',reason:'أغلب الإجابات مش بتشير لصعوبات متكررة.',questionIds:[] as string[],sourceId:'apa' as const},
  {id:'learning-habit',title:'جرّب استرجاع معلومة من غير مصدر',description:'بعد أي درس اكتب 3 نقاط من الذاكرة بدل إعادة القراءة مباشرة.',reason:'مهارة تعلم عامة مفيدة حتى لو مفيش صعوبات واضحة.',questionIds:['m1'],sourceId:'dunlosky' as const},
  {id:'sleep-habit',title:'خلي النوم في حسابك',description:'حاول تثبت وقت استيقاظ معقول وخصص وقت نوم كافي.',reason:'النوم الكافي مهم لليقظة والصحة العامة.',questionIds:['n1'],sourceId:'cdc' as const}
]

export type PersonalReport = {
  domainReadings: DomainReading[]
  questionReadings: QuestionReading[]
  patterns: PatternReading[]
  priorities: QuestionReading[]
  strengths: QuestionReading[]
  actions: PersonalAction[]
  plan: PlanDay[]
  videos: VideoResource[]
}

function planFromActions(actions: PersonalAction[]): PlanDay[] {
  const main=actions[0] ?? commonActions[0]
  const second=actions[1] ?? commonActions[1]
  const third=actions[2] ?? commonActions[2]
  const picked=[main,second,third]
  const personalized=(day:number,index:number,step:string):PlanDay=>{
    const action=picked[index%picked.length]
    return {day,title:step+' — '+action.title,task:action.description,why:action.reason}
  }
  return [
    {day:1,title:'لاحظ يومك',task:'دوّن موقفًا واحدًا فتحت فيه تطبيق من غير هدف، وسجّل وقت نومك وطاقة الصبح لو يهمك.',why:'ده قياس بداية بسيط بدل افتراض السبب.'},
    personalized(2,0,'أول تجربة'),
    personalized(3,1,'خطوة تانية'),
    {day:4,title:'وقت تركيز قابل للقياس',task:'نفّذ 15–25 دقيقة على مهمة واحدة، واكتب عدد المقاطعات الفعلية.',why:'التقدم في الأداء أهم من رقم الاختبار وحده.'},
    personalized(5,2,'حل مختلف'),
    {day:6,title:'طبق واسترجع',task:'اتعلم حاجة مفيدة وبعدها اكتب 3 أفكار من غير ما تبص للمصدر.',why:'الاسترجاع طريقة مدروسة لتحسين التعلم.'},
    {day:7,title:'مراجعة الأسبوع الأول',task:'راجع أكتر موقف اتكرر، وأكتر خطوة نفعتك، من غير جلد ذات.',why:'اختيار ما ناسبك أفضل من تنفيذ كل شيء بالقوة.'},
    personalized(8,0,'كرّر اللي نفعك'),
    personalized(9,1,'ثبّت عادة تانية'),
    {day:10,title:'قلّل مقاطعة واحدة',task:'حدد أكبر مقاطعة في مهامك وغيّر مكان الهاتف أو الإشعارات خلال جلسة واحدة.',why:'جرّب تغيير البيئة بدل الاعتماد على قوة الإرادة بس.'},
    personalized(11,2,'جرب حل إضافي'),
    {day:12,title:'فكر قبل ما تفتح',task:'في موقف فراغ واحد، اسأل نفسك محتاج راحة ولا ترفيه ولا تهرب من مهمة؟',why:'الوعي بالمحفزات يساعدك تختار ردًا مناسبًا.'},
    {day:13,title:'اختبر مهارة واحدة',task:'قارن مدى تركيزك أو نومك أو استرجاعك بالملاحظات من الأسبوع الأول.',why:'المقارنة مع نفسك أصدق من أي ادعاء بتحسّن مضمون.'},
    {day:14,title:'راجع وقرر اللي بعده',task:'راجع ملاحظاتك واختار عادة واحدة تكمل عليها. ممكن تعيد الاستبيان لنفسك، لكن النتيجة مش مقياس طبي للتعافي.',why:'الاستمرارية والتأثير على حياتك أهم من الوصول لصفر.'}
  ]
}

export function buildPersonalReport(answers: AnswerMap): PersonalReport {
  const questionReadings:QuestionReading[]=questions.map(question=>{
    const answer=answers[question.id] ?? 0
    const guide=questionGuides[question.id]
    const level:QuestionReading['level']= answer===0?'strength':answer===1?'light':answer===2?'noticeable':'frequent'
    const observation=answer===0?guide.strength:answer===1?'ده حصل نادرًا حسب إجابتك، فمش لازم يكون أولوية دلوقتي. '+guide.signal:guide.signal
    return {
      id:question.id,domain:question.domain,answer,answerLabel:options[answer]?.label ?? 'أبدًا',
      title:guide.title,observation,
      action:answer===0?'حافظ على العادة دي طالما مناسبة ليومك.':guide.nextStep,
      sourceId:guide.sourceId,level,
      weight:answer*10 + (question.domain==='impact'?4:0) + (question.domain==='sleep'?2:0)
    }
  })
  const domainReadings:DomainReading[]=domains.map(domain=>{
    const score=domainScore(answers,domain.id)
    const label=score<=3?'قليل جدًا':score<=7?'خفيف':score<=12?'ملحوظ':'متكرر'
    return {id:domain.id,title:domain.title,score,label,positive:score<=3,
      explanation: score<=3?'إجاباتك في المحور ده بتشير لصعوبات قليلة نسبيًا.':
        score<=7?'فيه بعض المواقف اللي تستحق الملاحظة من غير مبالغة.':
        score<=12?'فيه مواقف بتتكرر؛ خلّينا نختار منها حاجة واحدة نشتغل عليها.':
        'ده من الجوانب اللي ظهر فيها تكرار أعلى حسب إجاباتك، ومش تشخيص.'}
  }).sort((a,b)=>b.score-a.score)
  const patterns=patternRules.filter(rule=>rule.min.every(([id,min])=>(answers[id]??0)>=min))
    .map(rule=>({id:rule.id,title:rule.title,description:rule.description,action:rule.action,
       questionIds:rule.questionIds,sourceId:rule.sourceId,
       score:rule.questionIds.reduce((sum,id)=>sum+(answers[id]??0),0)
    })).sort((a,b)=>b.score-a.score).slice(0,4)
  const priorities=[...questionReadings].filter(reading=>reading.answer>=2).sort((a,b)=>b.weight-a.weight).slice(0,5)
  const strengths=questionReadings.filter(reading=>reading.answer<=1).sort((a,b)=>a.answer-b.answer).slice(0,3)
  const actions:PersonalAction[]=[]
  const seen=new Set<string>()
  const add=(candidate:PersonalAction)=>{
    if(seen.has(candidate.id)||actions.length>=6)return
    seen.add(candidate.id);actions.push(candidate)
  }
  for(const pattern of patterns.slice(0,2)) {
    add({id:'pattern-'+pattern.id,title:pattern.title,description:pattern.action,
       reason:'الاتنين أو أكتر من الإجابات المرتبطة بالنمط ده ظهرت بمستوى «أحيانًا» على الأقل.',
       questionIds:pattern.questionIds,sourceId:pattern.sourceId})
  }
  for(const reading of [...questionReadings].filter(x=>x.answer>=2).sort((a,b)=>b.weight-a.weight)) {
    const guide=questionGuides[reading.id]
    add({id:'question-'+reading.id,title:reading.title,description:guide.nextStep,
      reason:'اخترت «'+reading.answerLabel+'» في السؤال المرتبط بالسلوك ده.',
      questionIds:[reading.id],sourceId:guide.sourceId})
  }
  for(const action of commonActions) if(actions.length<3) add(action)
  const videos=[...arabicVideos].sort((a,b)=>{
    const score=(v:VideoResource)=>Math.max(...v.domains.map(d=>domainScore(answers,d))) +
      v.domains.reduce((n,d)=>n+(domainScore(answers,d)>=8?2:0),0)
    return score(b)-score(a)
  })
  return {domainReadings,questionReadings,patterns,priorities,strengths,actions,plan:planFromActions(actions),videos}
}
