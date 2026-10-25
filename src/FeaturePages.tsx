import type { AnswerMap } from './data'
import { PremiumContent } from './PremiumContent'
import { JourneyWorkspace } from './JourneyWorkspace'
export function LibraryPage({answers}:{answers:AnswerMap|null;onQuiz:()=>void}){
 return <div className="container route-page"><header className="feature-heading compact"><span className="section-kicker">كل التمارين متاحة مجانًا</span><h1>اختار تمرينًا واحدًا ليومك.</h1><p>ابدأ بالمستوى البسيط، وبعده جرّب التطبيق الأعمق. مفيش حاجة محتاجة اشتراك.</p></header><PremiumContent kind="library" answers={answers}/></div>
}
export function JourneyPage({owner,answers,onQuiz,onLogin}:{owner:string;answers:AnswerMap|null;onQuiz:()=>void;onLogin:()=>void}){
 return <section className="container route-page feature-page"><JourneyWorkspace key={owner} owner={owner} answers={answers} onStartQuiz={onQuiz} onLogin={onLogin}/></section>
}
