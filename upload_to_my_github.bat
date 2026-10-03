@echo off
chcp 65001 > nul
echo ========================================================
echo   رفع مواد منظومة العهد إلى مستودعك الخاص:
echo   https://github.com/ahdalamary-star/-1.git
echo ========================================================
echo.
echo لرفع الملفات إلى حسابك الخاص (ahdalamary-star)،
echo يتطلب GitHub رمز وصول شخصي (Personal Access Token).
echo.
echo يمكنك إنشاء الرمز بثوانٍ من:
echo https://github.com/settings/tokens
echo (اختر Generate new token - classic ثم حدد خيار repo واضغط Generate)
echo.
set /p TOKEN="الصق رمز GitHub Token هنا ثم اضغط Enter: "
echo.
if "%TOKEN%"=="" (
    echo ❌ لم يتم إدخال الرمز. تم الإلغاء.
    pause
    exit /b 1
)

echo جارٍ رفع كافة المواد والملفات...
node scripts/push_to_target.js %TOKEN%
echo.
pause
