@echo off
title Jadwal Kilat & Rest Guard AI - Launcher Lokal
cls
echo ===================================================================
echo             JADWAL KILAT & REST GUARD AI - LAUNCHER
echo ===================================================================
echo.
echo Memeriksa lingkungan komputer Anda...

where node >nul 2>nul
if %errorlevel% equ 0 (
    echo [OK] Node.js terdeteksi.
    if not exist node_modules (
        echo Menginstal dependensi pertama kali (memerlukan beberapa detik)...
        call npm install
    )
    echo Membuka aplikasi di peramban web default Anda...
    start http://localhost:3000
    echo Menjalankan dev server...
    call npm run dev
    goto end
)

where python >nul 2>nul
if %errorlevel% equ 0 (
    echo [INFO] Node.js tidak ditemukan, menjalankan via Python Web Server lokal...
    start http://localhost:3000
    python -m http.server 3000 --directory dist
    goto end
)

echo [INFO] Node.js dan Python belum terpasang.
echo Membuka browser langsung ke versi Live Demo online resmi:
start https://imonthetrack.github.io/make-schedule-with-AIv3/

:end
pause
