# MindReset — Brain Rot Assessment

موقع عربي خفيف بـ React وTypeScript لتقييم **عادات الاستخدام الرقمي**، مع تجربة سريعة مناسبة للموبايل وتحليل ذاتي واقتراحات عملية.

> **تنبيه علمي:** مصطلح *Brain Rot* دارج، وليس تشخيصًا طبيًا. الأسئلة الثلاثون والحدود الرقمية من إعداد المشروع، **وليست مقياسًا نفسيًا مُعتمدًا أو متحققًا من صدقه وثباته**. النتيجة لا تقيس تلف الدماغ ولا تصلح للتشخيص. المراجع العلمية تدعم أفكارًا وتوصيات محددة، ولا تمنح اختبارنا صلاحية إكلينيكية.

## المميزات

- واجهة مصرية بسيطة وRTL، مع تسجيل دخول Google قبل فتح محتوى التطبيق.
- 30 سؤالًا موزعة على 6 محاور، سؤال واحد في كل شاشة.
- انتقال تلقائي للإجابة التالية، مع خيار الرجوع وتعديل الإجابة.
- حفظ التقدم محليًا في المتصفح (localStorage).
- نتيجة من 120، وتحليل لكل محور، وتوصيات مبنية على نقاط الاهتمام الأعلى.
- تحدي 7 أيام، مشاركة ملخص النتيجة، والطباعة/الحفظ إلى PDF من المتصفح.
- صفحة مستقلة توضح حدود الاختبار ومراجعه.
- لا توجد قاعدة بيانات أو تحليلات مستخدمين في النسخة الحالية.

## التشغيل

يتطلب Node.js 20.19+ أو إصدارًا مناسبًا لـ Vite.

```bash
npm install
npm run dev
```

للتأكد من TypeScript وإنشاء نسخة الإنتاج:

```bash
npm run check
npm run build
npm run preview
```

## النشر

المشروع Vite SPA، ويمكن نشره مباشرة على Vercel:
- Framework Preset: **Vite**
- Build Command: `npm run build`
- Output Directory: `dist`

## هيكل المشروع

- `src/data.ts`: الأسئلة، المحاور، طريقة الحساب، قواعد التوصيات والمصادر.
- `src/main.tsx`: واجهة التطبيق والتفاعلات.
- `src/style.css`: التصميم المتجاوب العربي.
- `public/favicon.svg`: أيقونة الموقع.

## منهجية حساب الدرجات

الإجابات من 0 (أبدًا) إلى 4 (دايمًا). خمس أسئلة لكل محور (0–20) ومجموع كلي (0–120). الحدود الوصفية من إعداد المشروع: 0–20، 21–40، 41–60، 61–80، 81–120. **هذه الحدود غير مُعايرة علميًا**، ولا يصح تفسيرها كنسب ضرر.

التوصيات تعتمد على المحاور الأعلى حسب إجابات المستخدم، مع قاعدة واضحة في `prioritizedRecommendations`. لا يُستخدم نموذج ذكاء اصطناعي لتشخيص المستخدم أو اختراع استنتاجات.

## مراجع أولية

- Dunlosky et al. (2013) — [Effective Learning Techniques](https://doi.org/10.1177/1529100612453266)
- CDC — [About Sleep](https://www.cdc.gov/sleep/about/index.html)
- WHO — [Gaming Disorder](https://www.who.int/standards/classifications/frequently-asked-questions/gaming-disorder)
- APA — [Health Advisory on Social Media Use (adolescents)](https://www.apa.org/topics/social-media-internet/health-advisory-adolescent-social-media-use)
- Oxford University Press — [Word of the Year](https://corp.oup.com/word-of-the-year/)

**قبل التوسع:** مراجعة متخصصة للأسئلة ولغتها، دراسة الخصائص السيكومترية بعينة مناسبة، وتوثيق أي اقتباس أو استخدام لمقاييس منشورة مع الالتزام بالتراخيص.

## الخصوصية

إجابات الاختبار المحلي وخطة الزائر محفوظة على الجهاز داخل `localStorage`. حفظ النتائج في الحساب اختياري، وبدء خطة أثناء الدخول يحفظ نسخة إجاباتها وإعداداتها والتقدم والملاحظات في جدول `user_plans` بسياسات RLS لكل مستخدم. يمكن مسح الخطة من واجهتها. حذف بيانات الموقع من إعدادات المتصفح يزيلها. مشاركة النتيجة فعل اختياري يضغطه المستخدم؛ قد تحتوي المشاركة على درجته ومحاوره، فلا تشاركها إلا بموافقته.


## التحليل وخطة المتابعة

- `src/AnalysisExplorer.tsx`: تحليل المحاور والأسئلة والتنبيه لإجابة متكررة يخفيها المجموع.
- `src/SolutionLibrary.tsx`: مكتبة 24 تمرينًا، بحث وتصفية وترشيح مفسّر.
- `src/journey.ts`: اختيار 10 مسارات بقواعد ثابتة، 3 مدد و3 سياقات، وتوليد 14 يومًا من نسخة إجابات مكتملة.
- `src/JourneyWorkspace.tsx` و`src/plan-store.ts`: المعاينة وبدء الخطة والإنجاز والملاحظات واستئنافها وحذفها.
- `docs/user-plans-schema.sql`: نسخة المخطط المطبق باسم `private_personal_journeys`، مع تحقق شكل البيانات وصلاحيات أصحاب الحسابات فقط.

التخصيص بقواعد تحريرية، بدون AI وبدون بيانات معيارية لمستخدمين آخرين. الأفكار مستوحاة من مصادر موثقة، ولا تمثل علاجًا أو بروتوكولات معتمدة من مؤلفي الكتب. خطة نشطة واحدة لكل حساب؛ بدء خطة جديدة يستبدلها بعد تأكيد المستخدم، ولا يمسح نتائج الاختبارات. تحديثات أجهزة متعددة تعمل بنظام آخر حفظ؛ لا يوجد دمج متزامن للملاحظات. الاختبارات تشمل ألف ملف إجابات اصطناعي وكل اختيار للمسار والمدة والسياق.

بوابة `AccountGate` تعرض الدخول فقط قبل فحص الجلسة، وتمنع تركيب واجهة الاختبار أو المكتبة أو الخطط لغير المسجلين. سياسة الخصوصية العامة تظل متاحة للمراجعة قبل الموافقة على الدخول. حماية البيانات الخاصة تُفرض في قاعدة البيانات أيضًا بواسطة RLS.

## All features are free

All authenticated accounts can use detailed reports, the 36-exercise library, personal plans, full assessment history and comparisons, goals, focus, programs, habits, recall cards and reviews. No payment or subscription is required. Old `#/pro` and `#/upgrade` URLs redirect to `#/tools`.

Apply `docs/free-access-schema.sql` after the historical schema files. Legacy table and RPC names are retained for compatibility with existing data; RLS now checks ownership without paid entitlements. Admin access remains a separate private server-verified role. The dashboard lists registration metadata only, never personal answers or notes. Owner identities are provisioned privately and never committed.

`src/app-messages.tsx` implements shared in-app confirmations using an accessible modal dialog (safe cancellation, Escape, focus restoration). Destructive operations run only after explicit confirmation. Save/error messages are rendered within the app and only report success after persistence.

Exercises are original editorial activities with optional progression and reflection, not treatments or guaranteed outcomes. If editing `src/journey.ts`, synchronize the Edge Function shared source. Google sign-in is required before any app page; privacy remains public.

Validation: `npm test` and `npm run build`. Database checks use synthetic accounts in a rolled-back transaction to verify free access, owner isolation and admin denial. Browser end-to-end sign-in and real-account persistence require an available signed-in session.

Audit regression tests in `tests/interaction-audit.test.tsx` exercise the actual React components in a DOM with mocked authentication and APIs: 30-answer completion, library/plan/tool routing, browser history, storage quota failure, plan retry, failed interruption saves and in-app confirmation cancel/confirm/Escape/unmount. `tests/assessment-persistence.test.ts` covers exact inserted-row responses and paginated history. These tests do not replace Google sign-in and real-account browser acceptance testing. DOM tests require Node 22.22.2+, 24.15.0+, or a newer supported Node release.


## Admin phone notifications

`docs/admin-notifications-schema.sql` adds a private event outbox, idempotent assessment completion metadata, per-admin Web Push devices, service-only key/delivery RPCs, a signup trigger and a minute cron retry. Apply it after the existing admin and free-access schemas. `supabase/functions/admin-notifications/` verifies admin JWTs or a private database webhook secret before any operation. VAPID keys are generated once on the server and remain in the private database; no private key or webhook secret belongs in the frontend or repository.

`public/admin-sw.js` handles encrypted browser push notifications without intercepting requests or caching private data. Native notifications contain only a generic signup/completion message. Clicking opens the authenticated admin route. Administrators activate each phone explicitly; iOS/iPadOS requires an installed Home Screen web app on a supported OS. The settings page includes device opt-out and a real push test. A provider accepting a message is not proof it appeared on the device. Closed-browser delivery depends on OS/browser settings and connectivity. Delivery retries are bounded and event tags collapse duplicate notifications.

The client reports completion only after the final question, independently of optional saved answers. Failed event reporting retains the same UUID for a later retry; no answers or scores are included. The admin activity feed shows up to 50 recent events. Account refresh reloads database results without browser navigation.

Email reminders are **not enabled**. No sending provider has been provisioned or verified. The owner requires zero paid services and no purchased domain. A possible free option is Brevo's Free transactional plan, subject to provider approval and free-tier limits; connect a real free account and verified sender before implementing or enabling reminder delivery. Never claim email delivery or send reminder messages without that setup. No payment or subscription has been purchased.
