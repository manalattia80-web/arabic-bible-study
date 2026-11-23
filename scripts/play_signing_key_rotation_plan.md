# خطة تدوير مفتاح التوقيع والانتقال إلى Google Play App Signing

## ١. تشخيص الانكشاف الأمني
- كان ملف `mobile/android/app/upload-keystore.jks` وكلمات مروره (`storePassword` / `keyPassword` / `keyAlias`) مودعةً سابقًا في المستودع العام (`manalattia80-web/arabic-bible-study`)، وبصمة شهادته هي:
  `cf01f6cbfb94a557317e7e39916a5c8b325d399c740f3ea4f3e2c112b2815615`
- **قاعدة أمنية قاطعة**: حذف الملف من آخر التزام وحده **لا يعيد سريته**؛ لأن المفتاح وكلمات مروره تبقى محفوظة في سجل Git العام. لذا يُعامل المفتاح القديم بوصفه **مكشوفًا نهائيًا** ولا يجوز استخدامه كمفتاح توقيع أو مفتاح رفع على Google Play.

## ٢. المعالجة المنفّذة في الشيفرة والبناء (`release/play-internal-prep`)
1. **إزالة الأسرار من المصدر**:
   - أُزيل `mobile/android/app/upload-keystore.jks` من شجرة العمل، وأُضيفت قواعد تجاهل (`*.jks`, `*.keystore`, `mobile/android/key.properties`) إلى `.gitignore`.
   - عُدّل `mobile/android/app/build.gradle` ليقرأ بيانات التوقيع حصريًا من متغيرات البيئة (`ANDROID_KEYSTORE_PATH`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD`) أو ملف محلي غير متتبّع (`mobile/android/key.properties`)، مع بوابة إجبارية (`REQUIRE_RELEASE_SIGNING=true`) تفشل البناء إذا غابت أسرار التوقيع.
2. **فصل التوقيع في CI**:
   - يقرأ سير العمل أسرار التوقيع من **GitHub Actions Secrets** (`PLAY_UPLOAD_KEYSTORE_BASE64`, `PLAY_KEYSTORE_PASSWORD`, `PLAY_KEY_ALIAS`, `PLAY_KEY_PASSWORD`).
   - عند غياب أسرار Play في بيئة الفحص الآلي فقط، يولّد CI مفتاحًا مؤقتًا داخل `/tmp` لاختبارات `bundletool` والمحاكي، ويُوسَم البناء بوضوح بأنه غير موقّع بمفتاح الرفع الإنتاجي حتى تُضبط الأسرار.

## ٣. خطوات إنشاء مفتاح الرفع الجديد وتفعيل Play App Signing (تُنفَّذ محليًا دون رفع للمستودع)
1. **توليد مفتاح رفع جديد خاص محليًا** (خارج مجلد المستودع):
   ```bash
   keytool -genkeypair -v -keystore ~/secure-keys/play-upload-key.jks \
     -keyalg RSA -keysize 2048 -validity 10000 -alias play_upload_key
   ```
2. **تشفير الملف بـBase64 وإضافته إلى GitHub Repository Secrets** (`Settings → Secrets and variables → Actions`):
   - `PLAY_UPLOAD_KEYSTORE_BASE64`: ناتج `base64 -w 0 ~/secure-keys/play-upload-key.jks`
   - `PLAY_KEYSTORE_PASSWORD`: كلمة مرور مخزن المفاتيح الجديدة (قوية وعشوائية)
   - `PLAY_KEY_ALIAS`: `play_upload_key`
   - `PLAY_KEY_PASSWORD`: كلمة مرور المفتاح الجديدة
   *(مع حفظ نسخة احتياطية مشفّرة غير متصلة بالإنترنت خارج Git.)*
3. **التسجيل في Google Play App Signing**:
   - عند إنشاء التطبيق في Google Play Console، يُفعَّل خيار **Let Google manage and protect your app signing key** (الوضع الافتراضي).
   - يُرفع ملف `play-store-bundle.aab` الموقّع بمفتاح الرفع الجديد (`play_upload_key`)؛ فتسجّله Google كمفتاح رفع، وتتولى Google توليد مفتاح التوقيع النهائي للتطبيق وحمايته داخل بنيتها.

## ٤. خطة ترقية النسخ المثبتة سابقًا (`v1.0.382` من GitHub)
- النسخ التجريبية المثبتة يدويًا من GitHub (`v1.0.382` وما قبلها) موقّعة بالمفتاح المكشوف (`cf01f6cb...`).
- عند الانتقال إلى Google Play بمفتاح التوقيع الجديد (Play App Signing)، **لن يسمح نظام Android بالترقية المباشرة فوق النسخة المثبتة من GitHub** لاختلاف شهادة التوقيع.
- **الإجراء المطلوب للمختبرين لمرة واحدة فقط**: إزالة النسخة الجانبية المثبتة من GitHub (`v382`) ثم تثبيت نسخة الاختبار الداخلي من Google Play. بعدها تتم جميع الترقيات المستقبلية عبر المتجر (Internal → Closed → Production) بسلاسة تامة وبالمفتاح المحمي نفسه.
