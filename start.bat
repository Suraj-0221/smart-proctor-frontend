@echo off
echo Starting Smart Proctor Application Suite...

echo.
echo [1/2] Launching Python OCR Backend...
start "Smart Proctor Backend" cmd /k "cd backend && python main.py"

echo.
echo [2/2] Launching React UI Frontend...
start "Smart Proctor Frontend" cmd /k "cd smart-proctor && npm start"

echo.
echo Both services have been started in separate windows!
echo - React UI is running on http://localhost:3000
echo - Python Backend is running on http://localhost:8000
echo.
pause
