# Space Shooter Game

A simple space shooter game built with Phaser.js for web browsers.

## How to Run

**Important:** Due to browser security restrictions, you need to run this from a local web server, not by opening the HTML file directly.

### Option 1: Python (if installed)
```bash
cd /Users/kimmouridsen/Dropbox/CSR/FPS
python3 -m http.server 8000
```
Then open http://localhost:8000 in your browser.

### Option 2: Node.js (if installed)
```bash
cd /Users/kimmouridsen/Dropbox/CSR/FPS
npx http-server -p 8000
```
Then open http://localhost:8000 in your browser.

### Option 3: VS Code Live Server
If you're using VS Code, install the "Live Server" extension and right-click on `index.html` → "Open with Live Server"

## Controls

- **Desktop:** Arrow keys to move, Spacebar to shoot
- **Mobile/Tablet:** Drag finger to move ship, tap to shoot

## Game Features

- Player ship that moves through space
- Parallax scrolling star field background
- Enemies spawn from the top
- Shoot enemies to score points
- 3 hits = Game Over
- Score tracking

