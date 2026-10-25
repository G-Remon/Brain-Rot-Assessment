import { SectionHelp } from './UserGuide'
import type { AnswerMap } from './data'
import { PremiumContent } from './PremiumContent'
import { JourneyWorkspace } from './JourneyWorkspace'
export function LibraryPage({answers}:{answers:AnswerMap|null;onQuiz:()=>void}){
 return <div className="container route-page"><header className="feature-heading compact"><span className="section-kicker">كل التمارين متاحة مجانًا</span><h1>اختار تمرينًا واحدًا ليومك.</h1><p>ابدأ بالمستوى البسيط، وبعده جرّب التطبيق الأعمق. مفيش حاجة محتاجة اشتراك.</p></header><SectionHelp title="مكتبة الحلول" purpose="دي مكتبة تختار منها تمرينًا حسب احتياجك. لو عايز ترتيبًا جاهزًا، ابدأ بخطة الـ14 يوم." steps={['اختار مجالًا، أو فعّل «المناسب لإجاباتي فقط» لو كملت الاختبار.','افتح «الخطوات وطريقة القياس»، وجرّب المستوى البسيط من تمرين واحد.','لاحظ اللي حصل، وبعدها اختار التعمّق أو تمرينًا أنسب. التطبيق خارج الموقع؛ فتح التمرين مش تسجيل إنجاز.']} finish="اختيار تمرين واحد كفاية. مش مطلوب إنهاء المكتبة كلها."/><PremiumContent kind="library" answers={answers}/></div>
}
export function JourneyPage({owner,answers,onQuiz,onLogin}:{owner:string;answers:AnswerMap|null;onQuiz:()=>void;onLogin:()=>void}){
 return <section className="container route-page feature-page"><SectionHelp title="خطة الـ14 يوم" purpose="الخطة بترتّب لك خطوات من إجاباتك. لو لسه ما كملتش الاختبار، ابدأ بيه الأول." steps={['اختار المسار والوقت والسياق المناسب ليومك، ثم اضغط بدء الخطة.','افتح اليوم الأول، واقرأ المهمة وطبّقها فعلًا.','سجّل إتمام اليوم واحفظ ملاحظتك لو حابب، وبعدها ارجع لليوم التالي.']} finish="هدف أول زيارة: بدء الخطة وتنفيذ يوم واحد فقط."/><JourneyWorkspace key={owner} owner={owner} answers={answers} onStartQuiz={onQuiz} onLogin={onLogin}/></section>
}
