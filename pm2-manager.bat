@echo off
echo ========================================
echo  Income Expense Tracker - PM2 Manager
echo ========================================
echo.

:menu
echo [1] Start All Services
echo [2] Stop All Services
echo [3] Restart All Services
echo [4] View Status
echo [5] View Logs
echo [6] Exit
echo.
set /p choice="Enter your choice (1-6): "

if "%choice%"=="1" goto start
if "%choice%"=="2" goto stop
if "%choice%"=="3" goto restart
if "%choice%"=="4" goto status
if "%choice%"=="5" goto logs
if "%choice%"=="6" goto end
goto menu

:start
echo.
echo Starting all services...
pm2 start ecosystem.config.js
echo.
pause
goto menu

:stop
echo.
echo Stopping all services...
pm2 stop all
echo.
pause
goto menu

:restart
echo.
echo Restarting all services...
pm2 restart all
echo.
pause
goto menu

:status
echo.
pm2 status
echo.
pause
goto menu

:logs
echo.
echo Showing logs (Press Ctrl+C to exit)...
pm2 logs
goto menu

:end
echo.
echo Goodbye!
timeout /t 2
exit
