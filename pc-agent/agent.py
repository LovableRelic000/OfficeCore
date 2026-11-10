"""
OfficeCore PC Companion Agent (Windows 11)
Privacy-by-design desktop companion for ergonomics and flow monitoring.
Zero keylogging, zero window title logging, zero screenshots.
"""

import os
import sys
import time
import math
import logging
import threading
from datetime import datetime, timezone
import requests
from PIL import Image, ImageDraw

try:
    import tomllib  # Python 3.11+
except ImportError:
    import tomli as tomllib

try:
    import win32gui
    import win32process
    import psutil
    from pynput import keyboard, mouse
    import pystray
except ImportError as err:
    print(f"[PC Agent] Missing dependency: {err}. Please run: pip install -r requirements.txt")

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S"
)
logger = logging.getLogger("OfficeCoreAgent")

DEFAULT_CONFIG_PATH = os.path.join(os.path.dirname(__file__), "config.toml")
EXAMPLE_CONFIG_PATH = os.path.join(os.path.dirname(__file__), "config.toml.example")

PROCESS_CATEGORIES = {
    "editor": ["code.exe", "devenv.exe", "idea64.exe", "pycharm64.exe", "sublime_text.exe", "nvim.exe", "studio64.exe", "notepad++.exe"],
    "terminal": ["powershell.exe", "cmd.exe", "windowsterminal.exe", "bash.exe", "wsl.exe", "mintty.exe", "conhost.exe"],
    "browser": ["chrome.exe", "msedge.exe", "firefox.exe", "brave.exe", "opera.exe", "vivaldi.exe"],
    "meeting": ["teams.exe", "zoom.exe", "webex.exe", "meet.exe"],
    "chat": ["slack.exe", "discord.exe", "telegram.exe", "whatsapp.exe", "signal.exe"],
}

class PCAgent:
    def __init__(self, config_path: str = DEFAULT_CONFIG_PATH):
        self.config = self.load_config(config_path)
        self.backend_url = self.config.get("backend_url", "http://127.0.0.1:3000")
        self.token = self.config.get("token", "officecore_pc_demo_token_2026")
        self.is_paused = False
        self.is_running = True

        # Activity metrics for current 60s rollup
        self.keystrokes_count = 0
        self.mouse_events_count = 0
        self.inter_key_intervals = []
        self.last_key_time = None
        self.last_any_input_time = time.time()
        self.category_samples = []

        self.lock = threading.Lock()
        self.tray_icon = None

    def load_config(self, path: str) -> dict:
        if not os.path.exists(path):
            if os.path.exists(EXAMPLE_CONFIG_PATH):
                with open(EXAMPLE_CONFIG_PATH, "rb") as f:
                    return tomllib.load(f)
            return {"backend_url": "http://127.0.0.1:3000", "token": "officecore_pc_demo_token_2026"}

        with open(path, "rb") as f:
            return tomllib.load(f)

    def classify_active_app(self) -> str:
        """Derive app category strictly from process name without inspecting window title."""
        try:
            hwnd = win32gui.GetForegroundWindow()
            if not hwnd:
                return "other"
            _, pid = win32process.GetWindowThreadProcessId(hwnd)
            if pid <= 0:
                return "other"
            proc = psutil.Process(pid)
            exe_name = proc.name().lower()

            for category, exes in PROCESS_CATEGORIES.items():
                if exe_name in exes:
                    return category
            return "other"
        except Exception:
            return "other"

    def on_key_press(self, key):
        if self.is_paused:
            return
        now = time.time()
        with self.lock:
            self.keystrokes_count += 1
            if self.last_key_time is not None:
                interval = now - self.last_key_time
                if interval < 5.0:  # ignore long pauses between keystrokes
                    self.inter_key_intervals.append(interval)
            self.last_key_time = now
            self.last_any_input_time = now

    def on_mouse_event(self, *args):
        if self.is_paused:
            return
        with self.lock:
            self.mouse_events_count += 1
            self.last_any_input_time = time.time()

    def create_tray_image(self, active: bool = True):
        # Create a neumorphic soft circular badge icon
        img = Image.new("RGBA", (64, 64), color=(0, 0, 0, 0))
        draw = ImageDraw.Draw(img)
        # Neumorphic surface base #e0e5ec
        draw.ellipse([8, 8, 56, 56], fill=(224, 229, 236, 255))
        # Inner indicator: Lavender #9b72cf if active, muted gray if paused
        inner_color = (155, 114, 207, 255) if active else (160, 174, 192, 255)
        draw.ellipse([20, 20, 44, 44], fill=inner_color)
        return img

    def send_rollup(self, window_data: dict):
        url = f"{self.backend_url}/ingest/pc"
        headers = {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json"
        }
        payload = {"activityWindows": [window_data]}
        try:
            resp = requests.post(url, json=payload, headers=headers, timeout=5)
            if resp.status_code == 200:
                logger.info(f"Rollup synced successfully: {window_data['app_category']} | keys={window_data['keystrokes']} | mouse={window_data['mouse_events']}")
            else:
                logger.warning(f"Backend rejected rollup: {resp.status_code} {resp.text}")
        except Exception as e:
            logger.warning(f"Could not connect to backend ({self.backend_url}): {e}")

    def sampling_loop(self):
        logger.info("PC Agent sampling loop started.")
        while self.is_running:
            # Accumulate 6 ticks of 10s = 60s rollup
            for _ in range(6):
                if not self.is_running:
                    break
                time.sleep(10)
                if not self.is_paused:
                    cat = self.classify_active_app()
                    with self.lock:
                        self.category_samples.append(cat)

            if not self.is_running or self.is_paused:
                continue

            with self.lock:
                keystrokes = self.keystrokes_count
                mouse_events = self.mouse_events_count
                intervals = list(self.inter_key_intervals)
                categories = list(self.category_samples)
                now_time = time.time()
                idle_s = int(now_time - self.last_any_input_time)
                idle_s = min(60, max(0, idle_s))

                # Reset counters for next minute
                self.keystrokes_count = 0
                self.mouse_events_count = 0
                self.inter_key_intervals.clear()
                self.category_samples.clear()

            # Calculate Keystroke Coefficient of Variation (CV = std / mean)
            keystroke_cv = 0.0
            if len(intervals) >= 5:
                mean_int = sum(intervals) / len(intervals)
                variance = sum((x - mean_int) ** 2 for x in intervals) / len(intervals)
                std_int = math.sqrt(variance)
                if mean_int > 0:
                    keystroke_cv = round(std_int / mean_int, 2)

            # Determine dominant category
            dominant_cat = "other"
            if categories:
                counts = {}
                for c in categories:
                    counts[c] = counts.get(c, 0) + 1
                dominant_cat = max(counts, key=counts.get)

            rollup = {
                "ts_start": datetime.now(timezone.utc).isoformat(),
                "keystrokes": keystrokes,
                "keystroke_cv": keystroke_cv,
                "mouse_events": mouse_events,
                "idle_s": idle_s,
                "app_category": dominant_cat,
            }
            self.send_rollup(rollup)

    def toggle_pause(self, icon, item):
        self.is_paused = not self.is_paused
        status = "Pausado" if self.is_paused else "Activo"
        logger.info(f"Agent state changed: {status}")
        icon.icon = self.create_tray_image(active=not self.is_paused)

    def quit_agent(self, icon, item):
        logger.info("Stopping PC Agent...")
        self.is_running = False
        icon.stop()

    def run(self):
        # 1. Start input listeners
        kb_listener = keyboard.Listener(on_press=self.on_key_press)
        m_listener = mouse.Listener(on_move=self.on_mouse_event, on_click=self.on_mouse_event)
        kb_listener.daemon = True
        m_listener.daemon = True
        kb_listener.start()
        m_listener.start()

        # 2. Start sampling worker thread
        sampler_thread = threading.Thread(target=self.sampling_loop, daemon=True)
        sampler_thread.start()

        # 3. Setup System Tray
        menu = pystray.Menu(
            pystray.MenuItem("OfficeCore Companion", lambda icon, item: None, enabled=False),
            pystray.MenuItem(
                lambda text: "Reanudar monitoreo" if self.is_paused else "Pausar monitoreo",
                self.toggle_pause
            ),
            pystray.MenuItem("Salir", self.quit_agent)
        )

        self.tray_icon = pystray.Icon("OfficeCore", self.create_tray_image(active=True), "OfficeCore Companion", menu)
        logger.info(f"OfficeCore PC Agent ready. Backend URL: {self.backend_url}")
        self.tray_icon.run()

if __name__ == "__main__":
    agent = PCAgent()
    agent.run()
