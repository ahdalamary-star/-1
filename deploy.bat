@echo off
chcp 65001 > nul
echo ========================================================
echo   منظومة العهد للإنتاج والتصوير - النشر المباشر
echo   الحساب المعتمد: ahdalamary@gmail.com
echo ========================================================
echo.
echo 1. سيتم الآن فتح المتصفح لتسجيل الدخول ببريدك: ahdalamary@gmail.com
call npx firebase-tools login
echo.
echo 2. جارٍ رفع ونشر النسخة النهائية إلى الاستضافة المباشرة...
call npx firebase-tools deploy --only hosting
echo.
echo ========================================================
echo   تم النشر بنجاح! الموقع متاح على:
echo   https://al-ahad-app-2026.web.app
echo ========================================================
pause
