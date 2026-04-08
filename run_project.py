#!/usr/bin/env python3
"""
BiteMap Project Runner
Automates npm install & dev/build/preview commands for the BiteMap project.

Usage:
    python run_project.py [command]

Commands:
    install   - Install npm dependencies (npm install)
    dev       - Start the Vite development server (npm run dev)
    build     - Build for production (npm run build)
    preview   - Preview the production build (npm run preview)
    start     - Install dependencies then start dev server (default)
"""

import subprocess
import sys
import os


def run_cmd(cmd, description):
    """Run a shell command and stream its output in real-time."""
    print(f"\n{'='*50}")
    print(f"  {description}")
    print(f"{'='*50}\n")

    process = subprocess.Popen(
        cmd,
        shell=True,
        cwd=os.path.dirname(os.path.abspath(__file__)),
    )

    try:
        process.wait()
    except KeyboardInterrupt:
        print("\n\nStopping...")
        process.terminate()
        process.wait()
        sys.exit(0)

    if process.returncode != 0:
        print(f"\n[ERROR] '{cmd}' exited with code {process.returncode}")
        sys.exit(process.returncode)


def npm_install():
    run_cmd("npm install", "Installing npm dependencies...")


def npm_dev():
    run_cmd("npm run dev", "Starting Vite dev server...")


def npm_build():
    run_cmd("npm run build", "Building for production...")


def npm_preview():
    run_cmd("npm run preview", "Previewing production build...")


def main():
    command = sys.argv[1] if len(sys.argv) > 1 else "start"

    commands = {
        "install": npm_install,
        "dev":     npm_dev,
        "build":   npm_build,
        "preview": npm_preview,
        "start":   lambda: (npm_install(), npm_dev()),
    }

    if command in ("--help", "-h"):
        print(__doc__)
        sys.exit(0)

    if command not in commands:
        print(f"Unknown command: '{command}'")
        print(f"Available commands: {', '.join(commands.keys())}")
        sys.exit(1)

    commands[command]()


if __name__ == "__main__":
    main()
