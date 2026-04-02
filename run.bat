@echo off
:: ============================================================
::  BiteMap — Quick Start Script (Windows)
::  Calls run_project.py to handle npm install & dev server.
::
::  Usage:
::    run              :: install deps + start dev server
::    run dev          :: start dev server only
::    run build        :: production build
::    run install      :: install deps only
::    run preview      :: preview production build
:: ============================================================

python "%~dp0run_project.py" %*

pause
