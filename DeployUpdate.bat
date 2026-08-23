@echo off
chcp 65001 >nul
echo ========================================================
echo جاري تحديث الخادم لمعالجة الأخطاء النهائية...
echo ========================================================
echo.
echo سيتم الآن فتح المتصفح لتسجيل الدخول إلى Railway...
echo الرجاء الضغط على (Approve) في المتصفح عند ظهوره.
echo تسجيل الدخول... (اضغط انتر إذا طلب منك في المتصفح)
echo.

call C:\Users\manal\.gemini\antigravity\scratch\arabic-bible-study\node_dist\node-v20.11.1-win-x64\railway.cmd login

echo.
echo ممتاز! جاري الآن رفع التحديثات الجديدة إلى الخادم السحابي...
echo الرجاء الانتظار (قد يستغرق الأمر دقيقتين)...
echo.
cd C:\Users\manal\.gemini\antigravity\scratch\arabic-bible-study\backend
call C:\Users\manal\.gemini\antigravity\scratch\arabic-bible-study\node_dist\node-v20.11.1-win-x64\railway.cmd up

echo.
echo ========================================================
echo ✅ اكتمل التحديث بنجاح!
echo ========================================================
pause
