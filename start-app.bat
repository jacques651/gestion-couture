@echo off

start cmd /k "cd backend && npm run dev"

timeout /t 5 > nul

npm run tauri dev