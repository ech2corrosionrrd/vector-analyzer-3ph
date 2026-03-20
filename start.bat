@echo off
REM All-ASCII. Prefer global npm.cmd so a broken node_modules\npm never shadows the real npm.
setlocal

pushd "%~dp0" 2>nul
if errorlevel 1 (
  echo ERROR: cannot open folder of this script.
  echo Prefer Latin-only path, e.g. C:\vector-analyzer-3ph
  pause
  exit /b 1
)

if not exist "package.json" (
  echo ERROR: package.json not found. start.bat must be in project root.
  echo Current folder: %CD%
  popd
  pause
  exit /b 1
)

REM Broken partial "npm" package in node_modules makes Node load scripts from here and crash.
if exist "node_modules\npm\" (
  echo Removing broken folder node_modules\npm - it is not a project dependency.
  rmdir /s /q "node_modules\npm" 2>nul
)

set "NPM_CMD="
if exist "%ProgramFiles%\nodejs\npm.cmd" set "NPM_CMD=%ProgramFiles%\nodejs\npm.cmd"
if not defined NPM_CMD if exist "%ProgramFiles(x86)%\nodejs\npm.cmd" set "NPM_CMD=%ProgramFiles(x86)%\nodejs\npm.cmd"
if not defined NPM_CMD if exist "%LocalAppData%\Programs\nodejs\npm.cmd" set "NPM_CMD=%LocalAppData%\Programs\nodejs\npm.cmd"
if not defined NPM_CMD if exist "%USERPROFILE%\.volta\bin\npm.cmd" set "NPM_CMD=%USERPROFILE%\.volta\bin\npm.cmd"
if not defined NPM_CMD if exist "%USERPROFILE%\scoop\apps\nodejs\current\bin\npm.cmd" set "NPM_CMD=%USERPROFILE%\scoop\apps\nodejs\current\bin\npm.cmd"
if not defined NPM_CMD where npm >nul 2>&1 && set "NPM_CMD=npm"

if not defined NPM_CMD (
  echo ERROR: Node.js / npm not found. Install LTS from https://nodejs.org/
  popd
  pause
  exit /b 1
)

echo Starting VectorAnalyzer 3Ph...
echo Folder: %CD%
echo Using: %NPM_CMD%
echo.

set "NEED_INSTALL=0"
if not exist "node_modules\" set "NEED_INSTALL=1"
if not exist "node_modules\vite\" set "NEED_INSTALL=1"

if "%NEED_INSTALL%"=="1" (
  echo Running npm install --legacy-peer-deps ...
  call "%NPM_CMD%" install --legacy-peer-deps
  if errorlevel 1 (
    echo npm install failed.
    popd
    pause
    exit /b 1
  )
  echo.
)

call "%NPM_CMD%" run dev
set ERR=%ERRORLEVEL%
popd
if not "%ERR%"=="0" echo npm run dev failed with code %ERR%.
pause
exit /b %ERR%
