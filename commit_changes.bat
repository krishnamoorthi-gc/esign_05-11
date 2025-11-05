@echo off
echo Adding environment files and restart summary to git...
git add -f backend/OpenSignServer/.env frontend/OpenSign/.env PROJECT_RESTART_SUMMARY.md
echo Committing changes...
git commit -m "Fix project startup issues: Add environment files and restart summary"
echo Commit completed!
pause