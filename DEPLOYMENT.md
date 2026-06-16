# تعليمات النشر على Render (مجاني)

## الخطوة 1: رفع المشروع على GitHub

1. أنشئ حساب على GitHub إذا لم يكن لديك
2. أنشئ repository جديد
3. افتح terminal في مجلد المشروع ونفّذ:

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/USERNAME/REPO-NAME.git
git push -u origin main
```

## الخطوة 2: إنشاء حساب على Render

1. اذهب إلى https://render.com
2. سجّل حساب مجاني باستخدام GitHub

## الخطوة 3: نشر المشروع

1. بعد تسجيل الدخول، اضغط على "New +"
2. اختر "Web Service"
3. اربط حساب GitHub واختر repository الخاص بك
4. Render سيكتشف ملف `render.yaml` تلقائياً
5. اضغط "Create Web Service"

## الخطوة 4: إعداد MongoDB

Render سيقوم تلقائياً بإنشاء MongoDB مجاني حسب ملف `render.yaml`

## الخطوة 5: الحصول على الرابط

بعد انتهاء النشر (يستغرق 5-10 دقائق)، ستحصل على رابط مثل:
`https://clinic-backend.onrender.com`

## الخطوة 6: نشر الواجهة الأمامية (اختياري)

إذا كنت تريد نشر الواجهة الأمامية أيضاً:

1. في Render، اضغط "New +" ثم "Web Service"
2. اختر نفس repository
3. في Root Directory: اكتب `client`
4. Build Command: `npm install && npm run build`
5. Start Command: `npm run preview`
6. اضغط "Create Web Service"

## ملاحظات مهمة

- الاستضافة المجانية على Render تتوقف بعد 15 دقيقة من عدم النشاط وتستغرق 30 ثانية للإعادة تشغيل
- MongoDB المجاني محدود بـ 1GB
- تأكد من إضافة متغير البيئة `JWT_SECRET` في إعدادات Render
