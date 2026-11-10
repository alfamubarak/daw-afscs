@echo off
rem Launcher adapted from the Timbuktu Triangle run.bat (same Edge kiosk flags).
rem Only change: the file:// URL is built with forward slashes and %%%%20 so folders containing spaces work.
setlocal EnableDelayedExpansion
set "EDGE=C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
if not exist "%EDGE%" set "EDGE=C:\Program Files\Microsoft\Edge\Application\msedge.exe"
if not exist "%EDGE%" (
  echo Microsoft Edge was not found. Install Edge or edit the EDGE path in run.bat.
  pause
  exit /b 1
)
set "APPDIR=%~dp0"
set "URL=%APPDIR:\=/%index.html"
set "URL=!URL: =%%20!"
start "" "%EDGE%" --kiosk "file:///%URL%" --edge-kiosk-type=fullscreen --no-first-run --disable-features=msEdgeEnterpriseModePolicies
endlocal
