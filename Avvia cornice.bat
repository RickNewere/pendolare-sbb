@echo off
REM Avvia la web app a schermo intero (modalita chiosco) su Microsoft Edge.
REM Ideale per una cornice / display fisso. Per uscire: Ctrl+W oppure Alt+F4.
start msedge --kiosk "file:///C:/Users/rober/Desktop/Pendolare-SBB/index.html" --edge-kiosk-type=fullscreen --no-first-run --disable-features=Translate
