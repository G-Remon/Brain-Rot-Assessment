export type DomainId = 'focus' | 'scroll' | 'patience' | 'memory' | 'sleep' | 'impact'
export type Question = { id: string; domain: DomainId; text: string }
export type Domain = { id: DomainId; title: string; icon: string; short: string; description: string }

export const domains: Domain[] = [
  { id: 'focus', title: 'التركيز والانتباه', icon: 'target', short: 'التركيز', description: 'قد إيه بتعرف تكمل مهمة من غير مقاطعات أو تنقل بين حاجات كتير.' },
  { id: 'scroll', title: 'التحكم في التصفح', icon: 'smartphone', short: 'التصفح', description: 'هل استخدام التطبيقات اختيار واعي ولا ساعات بيحصل تلقائيًا؟' },
  { id: 'patience', title: 'الصبر وتحمل الملل', icon: 'hourglass', short: 'الصبر', description: 'قدرتك تقعد من غير تحفيز مستمر وتستحمل الأنشطة الهادية.' },
  { id: 'memory', title: 'التعلّم والتفكير', icon: 'book-open', short: 'التعلّم', description: 'إحساسك بمدى الاستيعاب واسترجاع المعلومات والتفكير العميق.' },
  { id: 'sleep', title: 'النوم والطاقة', icon: 'moon', short: 'النوم', description: 'علاقة استخدام الشاشة بروتين نومك وإحساسك بالطاقة.' },
  { id: 'impact', title: 'التأثير على يومك', icon: 'activity', short: 'الحياة اليومية', description: 'هل الاستخدام بيأثر فعلًا على شغلك أو دراستك أو علاقاتك؟' }
]

export const questions: Question[] = [
  { id:'f1',domain:'focus',text:'بمسك الموبايل وأنا بذاكر أو بشتغل، حتى لو مفيش إشعار.' },
  { id:'f2',domain:'focus',text:'بتكون صعبة عليّا أكمل شرح طويل من غير ما أتنقل لحاجة تانية.' },
  { id:'f3',domain:'focus',text:'ببدأ مهمة مهمة وبحس بعدها بشوية إني عايز أفتح تطبيق تاني.' },
  { id:'f4',domain:'focus',text:'بضطر أعيد قراءة نفس الفقرة بسبب التشتت.' },
  { id:'f5',domain:'focus',text:'بلاقي صعوبة أركز في مهمة واحدة لمدة 25 دقيقة.' },
  { id:'s1',domain:'scroll',text:'بفتح فيديوهات قصيرة شوية وبفاجأ إن وقت طويل عدى.' },
  { id:'s2',domain:'scroll',text:'بكمل أقلب في الفيديوهات حتى لو مش مستمتع.' },
  { id:'s3',domain:'scroll',text:'بحط لنفسي وقت معين للتصفح وبلاقي صعوبة ألتزم بيه.' },
  { id:'s4',domain:'scroll',text:'بفتح تطبيقات الترفيه أول ما أصحى من غير سبب مهم.' },
  { id:'s5',domain:'scroll',text:'بقفل التطبيق وبفتحه تاني بعد دقايق بشكل تلقائي.' },
  { id:'p1',domain:'patience',text:'بتضايق لما أستنى شوية من غير ما أمسك الموبايل.' },
  { id:'p2',domain:'patience',text:'بستعجل النتيجة وبضيق من الحاجات اللي محتاجة وقت.' },
  { id:'p3',domain:'patience',text:'بصعب عليّا أقعد بهدوء من غير شاشة أو ترفيه.' },
  { id:'p4',domain:'patience',text:'بسيب محتوى مفيد لمجرد إنه بطيء أو مش مشوق.' },
  { id:'p5',domain:'patience',text:'بحس إني محتاج حاجة تسليني طول الوقت.' },
  { id:'m1',domain:'memory',text:'بنسى تفاصيل المحتوى اللي شوفته من وقت قريب.' },
  { id:'m2',domain:'memory',text:'بلاقي صعوبة ألخص موضوع طويل بكلامي.' },
  { id:'m3',domain:'memory',text:'بتنقل بين مواضيع كتير من غير ما أتعلم واحد بعمق.' },
  { id:'m4',domain:'memory',text:'بصعب عليّا أرتب أفكاري لما أشرح حاجة معقدة.' },
  { id:'m5',domain:'memory',text:'بختار الملخص السريع بدل الفهم الكامل حتى في الحاجات المهمة.' },
  { id:'n1',domain:'sleep',text:'بأخر معاد نومي بسبب التصفح.' },
  { id:'n2',domain:'sleep',text:'بستخدم الموبايل في السرير وبيكون صعب أقفله.' },
  { id:'n3',domain:'sleep',text:'بحس بإرهاق ذهني بعد فترة طويلة من المحتوى السريع.' },
  { id:'n4',domain:'sleep',text:'بصحى قليل النشاط بعد ليلة قضيتها في التصفح.' },
  { id:'n5',domain:'sleep',text:'بكمل أتصفح رغم إني محتاج أنام أو أرتاح.' },
  { id:'i1',domain:'impact',text:'التصفح بيخليني أأجل شغل أو مذاكرة أو مسؤوليات.' },
  { id:'i2',domain:'impact',text:'بلجأ للفيديوهات أو الألعاب عشان أهرب من ضغط أو مشكلة.' },
  { id:'i3',domain:'impact',text:'بنشغل بالموبايل وأنا مع ناس يهموني.' },
  { id:'i4',domain:'impact',text:'بحس إن التطبيقات بتتحكم في وقتي أكتر مني.' },
  { id:'i5',domain:'impact',text:'استخدامي للمحتوى السريع أثّر بشكل سلبي على أهدافي.' }
]

export const options = [
  { value:0, label:'أبدًا' },
  { value:1, label:'نادرًا' },
  { value:2, label:'أحيانًا' },
  { value:3, label:'غالبًا' },
  { value:4, label:'دايمًا' }
]

export type AnswerMap = Record<string, number>
export function domainScore(answers: AnswerMap, domain: DomainId) {
  return questions.filter(q => q.domain===domain).reduce((sum,q) => sum + (answers[q.id] ?? 0), 0)
}
export function totalScore(answers: AnswerMap) {
  return questions.reduce((sum,q) => sum + (answers[q.id] ?? 0),0)
}
export function getBand(value: number) {
  if (value <= 20) return {title:'مؤشرات قليلة',note:'إجاباتك مش بتشير لصعوبات متكررة في أغلب المحاور.',tone:'good'}
  if (value <= 40) return {title:'مؤشرات خفيفة',note:'فيه عادات بسيطة ممكن تحسينها يخلي يومك أريح.',tone:'good'}
  if (value <= 60) return {title:'مؤشرات متوسطة',note:'فيه جوانب بتتكرر فيها الصعوبات ومحتاجة اهتمام.',tone:'moderate'}
  if (value <= 80) return {title:'مؤشرات مرتفعة',note:'واضح من إجاباتك إن فيه صعوبات ملحوظة في أكتر من جانب.',tone:'moderate'}
  return {title:'مؤشرات مرتفعة جدًا',note:'إجاباتك بتشير لصعوبات متكررة. لو مأثرة على حياتك، فممكن تستفيد من مساعدة متخصصة.',tone:'high'}
}
export type Recommendation = { title:string; description:string; action:string; evidence:string; sourceId:string; domains: DomainId[] }
export const recommendations: Recommendation[] = [
  {title:'جلسة تركيز واحدة بجد',description:'اختار مهمة واحدة وحدد 25 دقيقة من غير تنقل بين التطبيقات. لو المدة طويلة عليك، ابدأ بـ10 دقائق.',action:'جرّبها النهارده مرة واحدة، واكتب عدد المقاطعات.',evidence:'اقتراح عملي لتنظيم البيئة وتقليل التشتيت، مش علاج طبي مثبت.',sourceId:'apa',domains:['focus','impact']},
  {title:'خلي الموبايل بعيد وقت المهمة',description:'اقفل الإشعارات غير المهمة وسيب الموبايل بعيد عن إيدك خلال الشغل اللي محتاج تركيز.',action:'اختار مهمة بكره وجربها من غير إشعارات.',evidence:'إدارة المقاطعات إجراء عملي لدعم الانتباه.',sourceId:'apa',domains:['focus','scroll']},
  {title:'اعرف إيه اللي بيخلّيك تفتح التطبيق',description:'قبل التصفح اسأل نفسك: أنا داخل أعمل إيه؟ وافتكر كنت بتعمل إيه قبلها.',action:'لاحظ 3 مرات فتحت فيها تطبيق تلقائيًا.',evidence:'تمرين سلوكي لتنمية الوعي بالعادات، مش تشخيص للإدمان.',sourceId:'apa',domains:['scroll','patience']},
  {title:'وقت ترفيه متفق عليه',description:'بدل المنع الكامل، جرّب تخلي الترفيه في وقت إنت محدده. لو مش قادر تلتزم، راجع الأسباب والمحفزات.',action:'حدد فترة ترفيه مناسبة ليومك.',evidence:'اقتراح لإدارة الوقت والاستخدام المقصود.',sourceId:'who',domains:['scroll','impact']},
  {title:'اقعد مع الملل شوية',description:'جرّب 10 دقائق مشي هادي أو قعدة من غير تمرير تلقائي. مش مطلوب تمنع الترفيه.',action:'ابدأ بـ5–10 دقائق في وقت مناسب.',evidence:'تجربة عملية لملاحظة عاداتك، وليست اختبارًا للدماغ.',sourceId:'apa',domains:['patience','scroll']},
  {title:'استرجع بدل ما تعيد القراءة',description:'بعد ما تذاكر، اقفل المصدر واكتب 3 معلومات فاكرها من غير ما تبص.',action:'راجع نفس المعلومات بكرة وبعد كام يوم.',evidence:'الاسترجاع النشط والمراجعة المتباعدة من استراتيجيات التعلم المدروسة.',sourceId:'dunlosky',domains:['memory','focus']},
  {title:'اشرح الفكرة بصوتك',description:'بعد شرح أو درس، حاول تشرحه بكلامك ببساطة، وحدد الجزء اللي مش فاهمه.',action:'سجّل ملخص 60 ثانية لآخر حاجة اتعلمتها.',evidence:'نشاط استرجاع وتقييم للفهم، وليس اختبار ذاكرة معياريًا.',sourceId:'dunlosky',domains:['memory']},
  {title:'ثبّت معاد استيقاظك',description:'حاول تنام وتصحى في مواعيد متقاربة، وتدي جسمك وقت نوم كفاية.',action:'سجّل موعد النوم والاستيقاظ لمدة 3 أيام.',evidence:'انتظام النوم والحصول على قدر كافٍ من النوم من توصيات الصحة العامة.',sourceId:'cdc',domains:['sleep','focus']},
  {title:'بلاش التصفح ياخد من نومك',description:'لو الموبايل بيأخر نومك، جرّب روتين هادي آخر نصف ساعة وحطه بعيد عن السرير.',action:'جرّب ليلتين وقارن إحساسك الصبح.',evidence:'جزء من عادات النوم الصحية المقترحة، والسبب الحقيقي للإرهاق قد يكون مختلفًا.',sourceId:'cdc',domains:['sleep','scroll']},
  {title:'خطط لأولويتك قبل اليوم ما يجري',description:'اكتب أهم مهمة أو اتنين وحدد إمتى هتبدأ. مش لازم تخلص كل المجالات في يوم واحد.',action:'اكتب أهم مهمة لبكرة ووقت بدايتها.',evidence:'استراتيجية عملية للتنظيم، مش علاج مثبت لأي اضطراب.',sourceId:'apa',domains:['impact','focus']},
  {title:'خد بالك من تأثير الاستخدام',description:'لو عادة رقمية مأثرة على دراستك أو علاقتك بالناس، ركز على أثرها الحقيقي مش عدد الساعات بس.',action:'سجّل موقفًا واحدًا حصل فيه تعارض، وحط له بديل.',evidence:'التأثير الوظيفي وفقدان السيطرة أهم من عدد ساعات اللعب وحده في تعريف اضطراب الألعاب.',sourceId:'who',domains:['impact','scroll']}
]
export const sources = [
  {id:'dunlosky',title:'Improving Students’ Learning With Effective Learning Techniques',by:'Dunlosky et al. · Psychological Science in the Public Interest · 2013',url:'https://doi.org/10.1177/1529100612453266',summary:'مراجعة علمية لاستراتيجيات التعلم، ومنها الاختبار الذاتي والمراجعة المتباعدة.'},
  {id:'cdc',title:'About Sleep',by:'CDC · Sleep and Sleep Disorders',url:'https://www.cdc.gov/sleep/about/index.html',summary:'إرشادات عامة عن النوم الكافي والعادات اللي بتساعد على نوم صحي.'},
  {id:'who',title:'Gaming Disorder',by:'World Health Organization · ICD-11',url:'https://www.who.int/standards/classifications/frequently-asked-questions/gaming-disorder',summary:'شرح الفرق بين اللعب العادي واضطراب الألعاب، وأهمية فقدان السيطرة والتأثير على الحياة.'},
  {id:'apa',title:'Health Advisory on Social Media Use',by:'American Psychological Association · 2023',url:'https://www.apa.org/topics/social-media-internet/health-advisory-adolescent-social-media-use',summary:'إرشادات عن الاستخدام الرقمي، مع ملاحظة أن كثيرًا من التوصيات موجهة للمراهقين وليست مقياسًا للبالغين.'},
  {id:'oxford',title:'Brain Rot — Word of the Year 2024',by:'Oxford University Press · 2024',url:'https://corp.oup.com/word-of-the-year/',summary:'خلفية لغوية عن المصطلح الدارج، وليس تعريفًا لتشخيص طبي.'}
]
export function prioritizedRecommendations(answers:AnswerMap){
  const priority=[...domains].sort((a,b)=>domainScore(answers,b.id)-domainScore(answers,a.id))
  const selected:Recommendation[]=[]
  for (const domain of priority) {
    if(domainScore(answers,domain.id)<4) continue
    for(const rec of recommendations.filter(r=>r.domains.includes(domain.id))) {
      if(selected.some(s=>s.title===rec.title)) continue
      selected.push(rec)
      if(selected.length>=6) return selected
      break
    }
  }
  for (const rec of recommendations) {
    if(selected.length>=6) break
    if (!selected.includes(rec) && rec.domains.some(d=>domainScore(answers,d)>=5)) selected.push(rec)
  }
  return selected.length ? selected : recommendations.filter(r=>['استرجع بدل ما تعيد القراءة','ثبّت معاد استيقاظك','جلسة تركيز واحدة بجد'].includes(r.title))
}

/** Reading suggestions are practical, not clinical prescriptions.
 * Publisher/author sources are linked directly for each title.
 */
export type BookRecommendation = {
  id: string
  domain: DomainId
  title: string
  author: string
  label: string
  why: string
  tryThis: string
  url: string
  color: string
}
export const bookRecommendations: BookRecommendation[] = [
  {id:'deep-work',domain:'focus',title:'Deep Work',author:'Cal Newport',label:'لو تركيزك بيتقطع',why:'أفكاره عن الشغل العميق وتقليل المقاطعات هتفيدك لو صعب تكمل مهمة واحدة.',tryThis:'جرّب جلسة تركيز واحدة من غير موبايل.',url:'https://www.hachettebookgroup.com/titles/cal-newport/deep-work/9781455586691/',color:'navy'},
  {id:'digital-minimalism',domain:'scroll',title:'Digital Minimalism',author:'Cal Newport',label:'لو التصفح بياخدك',why:'بيساعدك تفكر في استخدام التكنولوجيا باختيارك، بدل فتح التطبيقات تلقائيًا.',tryThis:'اختار التطبيقات اللي فعلًا بتضيف قيمة ليومك.',url:'https://www.penguinrandomhouse.com/books/575667/digital-minimalism-by-cal-newport/9780525536512/',color:'mint'},
  {id:'indistractable',domain:'patience',title:'Indistractable',author:'Nir Eyal',label:'لو الملل بيشدّك للموبايل',why:'بيتكلّم عن مسببات التشتت وطرق عملية للتعامل معاها من غير منع التكنولوجيا بالكامل.',tryThis:'اكتب إمتى بتفتح الموبايل عشان تهرب من الملل.',url:'https://www.simonandschuster.com/books/Indistractable/Nir-Eyal/9781948836531',color:'coral'},
  {id:'make-it-stick',domain:'memory',title:'Make It Stick',author:'Peter C. Brown, Henry L. Roediger III & Mark A. McDaniel',label:'لو عايز تفتكر اللي بتتعلمه',why:'بيشرح طرق مذاكرة واسترجاع معلومات أفضل من إعادة القراءة طول الوقت.',tryThis:'اقفل المصدر وجاوب من ذاكرتك بعد كل درس.',url:'https://www.makeitstick.com/',color:'indigo'},
  {id:'sleep-solution',domain:'sleep',title:'The Sleep Solution',author:'W. Chris Winter, M.D.',label:'لو نومك مأثر على طاقتك',why:'كتاب من طبيب متخصص في النوم، عن فهم مشاكل النوم وعاداته.',tryThis:'سجّل مواعيد نومك وصحيانك لمدة 3 أيام.',url:'https://www.penguinrandomhouse.com/books/540559/the-sleep-solution-by-w-chris-winter-md/',color:'blue'},
  {id:'four-thousand-weeks',domain:'impact',title:'Four Thousand Weeks',author:'Oliver Burkeman',label:'لو بتحس إن وقتك بيجري',why:'بيقدّم منظورًا أهدى لإدارة الوقت وتحديد الأولويات بدل محاولة تخلص كل حاجة.',tryThis:'اختار أهم مهمة واقعية لبكرة.',url:'https://us.macmillan.com/books/9781250849359/fourthousandweeks/',color:'sand'}
]
export function recommendBooks(answers: AnswerMap): BookRecommendation[] {
  const ranked=[...bookRecommendations].sort((a,b)=>domainScore(answers,b.domain)-domainScore(answers,a.domain))
  const relevant=ranked.filter(book=>domainScore(answers,book.domain)>=4)
  return relevant.length ? relevant.slice(0,3) : [bookRecommendations[0], bookRecommendations[3]]
}

