"""
1937 HISTORY - SPECIAL POWERS EDITION (V15)
===========================================
"""

import sys
import time
from datetime import datetime

# Local imports
from sim1937 import Config, GameEngine, RoundTimer

# --- CONFIG ---
SHEETS_AVAILABLE = False
try:
    import gspread
    from oauth2client.service_account import ServiceAccountCredentials
    SHEETS_AVAILABLE = True
except ImportError:
    pass

def initialize_sheets(sheet, engine):
    print("--- 🛠️  Initializing Sheets... ---")
    try:
        inputs_ws = sheet.worksheet(Config.INPUTS_SHEET)
        inputs_ws.batch_clear(["D2:D100"])
    except:
        inputs_ws = sheet.add_worksheet(title=Config.INPUTS_SHEET, rows=1000, cols=5)
        inputs_ws.append_row(["Country", "Action", "Target", "Status", "Timer"])
    
    try: dash_ws = sheet.worksheet(Config.DASHBOARD_SHEET)
    except: dash_ws = sheet.add_worksheet(title=Config.DASHBOARD_SHEET, rows=1000, cols=10)
    dash_ws.clear()

    try: action_ws = sheet.worksheet(Config.ACTION_LOG_SHEET)
    except: action_ws = sheet.add_worksheet(title=Config.ACTION_LOG_SHEET, rows=1000, cols=6)
    
    try: event_ws = sheet.worksheet(Config.EVENT_LOG_SHEET)
    except: event_ws = sheet.add_worksheet(title=Config.EVENT_LOG_SHEET, rows=1000, cols=3)

    if not action_ws.row_values(1):
        action_ws.append_row(["Time / 時間", "Round", "Actor / 国", "Action / 行動", "Target / 対象", "Result / 結果"])
    if not event_ws.row_values(1):
        event_ws.append_row(["Time / 時間", "Round", "Event / イベント"])

    update_dashboard(inputs_ws, dash_ws, engine, Config.ROUND_DURATION_SEC)
    print("--- ✅ Sheets Initialized & Populated! ---")
    return inputs_ws, dash_ws, action_ws, event_ws

def update_dashboard(inputs_ws, dash_ws, engine, time_left):
    minutes = time_left // 60
    seconds = time_left % 60
    
    if time_left <= 0:
        warning = f"🔴 ROUND ENDED"
    elif time_left < 30:
        warning = f"⚠️  {minutes}:{seconds:02d} ⚠️"
    elif time_left < 120:
        warning = f"⏰ {minutes}:{seconds:02d}"
    else:
        warning = f"R{engine.current_round} | {minutes}:{seconds:02d}"
    
    dash_ws.update(range_name='J1', values=[[warning]])
    try: inputs_ws.update(range_name='E1', values=[[warning]])
    except: pass

    headers = ["Country / 国", "Status / 状態", "VP", "Econ / 経済", "Mil / 軍事", "Pol / 政治", "Dip / 外交", "Allies / 同盟", "Special / 特殊"]
    data = [headers]
    
    sorted_c = sorted(engine.unique_countries, key=lambda x: x.vp_total, reverse=True)
    
    for c in sorted_c:
        if c.is_defeated:
            years_held = engine.current_round - c.conquered_round
            st = f"🔴 Puppet ({years_held} yrs) | Master: {c.puppet_master}"
        else:
            st = f"🟢 Active (R{engine.current_round})"
        # Special column
        spec_txt = "USED / 使用済" if c.special_used else f"READY: {c.special_code}"
        data.append([c.name_full, st, c.vp_total, c.econ, c.mil, c.pol, c.dip, ", ".join(list(c.allies)), spec_txt])
    
    dash_ws.update(range_name='A1', values=data)

def display_end_game(dash_ws, engine):
    active = sorted([c for c in engine.unique_countries if not c.is_defeated], key=lambda x: x.vp_total, reverse=True)
    data = [["🏆 FINAL STANDINGS / 最終順位"]]
    data.append(["Rank / 順位", "Country / 国", "VP", "Ideology / 陣営"])
    for rank, c in enumerate(active, 1):
        medal = "🥇" if rank == 1 else ("🥈" if rank == 2 else ("🥉" if rank == 3 else "  "))
        data.append([f"{medal} {rank}", c.name_full, c.vp_total, c.ideology.value])
    dash_ws.clear()
    dash_ws.update(range_name='A1', values=data)
    print("\n🏆 GAME OVER / ゲーム終了")

def main():
    while True:
        engine = GameEngine()
        if not SHEETS_AVAILABLE:
            print("!! TEST MODE (No Sheets) !!")
            return

        scope = ['https://spreadsheets.google.com/feeds', 'https://www.googleapis.com/auth/drive']
        creds = ServiceAccountCredentials.from_json_keyfile_name(Config.CREDENTIALS_FILE, scope)
        client = gspread.authorize(creds)
        sheet = client.open(Config.SHEET_NAME)
        
        inputs_ws, dash_ws, action_log_ws, event_log_ws = initialize_sheets(sheet, engine)
        
        print(f"--- 1937 SPECIAL POWERS (V15) READY ---")
        print(f"Controls: Press Ctrl+C to pause/menu.")
        
        game_active = True
        force_next_round = False
        last_update = time.time()
        last_dashboard_update = time.time()
        
        # Trigger initial events and log them
        engine.trigger_round_event()
        ts = datetime.now().strftime("%H:%M:%S")
        if engine.events_buffer:
            for ev in engine.events_buffer:
                print(f"\n🎲 {ev}")  # Print to terminal
                event_log_ws.append_row([ts, engine.current_round, ev])
            engine.events_buffer = []
        update_dashboard(inputs_ws, dash_ws, engine, Config.ROUND_DURATION_SEC)
        
        while game_active:
            try:
                if not force_next_round:
                    time_left = engine.timer.get_time_left()
                    rows = inputs_ws.get_all_values()[1:]
                    
                    # Process ONE action per iteration to avoid race conditions
                    action_processed = False
                    for i, row in enumerate(rows):
                        if len(row) < 4: continue
                        country, action, target, status = row[0], row[1], row[2], row[3]
                        if country and action and status == "":
                            result = engine.process_turn(country, action, target)
                            inputs_ws.update_cell(i + 2, 4, result)
                            print(f"[{country}] {result}")
                            ts = datetime.now().strftime("%H:%M:%S")
                            action_log_ws.append_row([ts, engine.current_round, country, action, target, result])
                            action_processed = True
                            break  # Process one action at a time
                    
                    # Update dashboard only every 5 seconds to reduce API quota usage
                    if time.time() - last_dashboard_update >= 5:
                        update_dashboard(inputs_ws, dash_ws, engine, time_left)
                        last_dashboard_update = time.time()
                    
                    # Accurate timing - adjust sleep for processing time
                    elapsed = time.time() - last_update
                    sleep_amt = max(0.1, 2 - elapsed)
                    time.sleep(sleep_amt)
                    last_update = time.time()

                if force_next_round or time_left <= 0:
                    print(f"\n=== ROUND {engine.current_round} END ===")
                    engine.update_scores()
                    
                    ts = datetime.now().strftime("%H:%M:%S")
                    event_log_ws.append_row([ts, engine.current_round, f"Round Ended / ラウンド終了"])
                    if engine.events_buffer:
                        for ev in engine.events_buffer:
                            event_log_ws.append_row([ts, engine.current_round, ev])
                        engine.events_buffer = []

                    if engine.current_round >= Config.MAX_ROUNDS:
                        display_end_game(dash_ws, engine)
                        event_log_ws.append_row([datetime.now().strftime("%H:%M:%S"), "END", "GAME OVER / ゲーム終了"])
                        print("Waiting... Press Ctrl+C to Reset or Quit.")
                        while True: time.sleep(1)
                        break

                    engine.current_round += 1
                    print(f"\n\n=== ROUND {engine.current_round} START / ラウンド{engine.current_round}開始 ===")
                    engine.trigger_round_event()
                    
                    # Log new round event immediately
                    ts = datetime.now().strftime("%H:%M:%S")
                    if engine.events_buffer:
                        for ev in engine.events_buffer:
                            print(f"🎲 {ev}")  # Print to terminal
                            event_log_ws.append_row([ts, engine.current_round, ev])
                        engine.events_buffer = []
                    
                    inputs_ws.batch_clear(["B2:D100"])  # Clear Action, Target, and Status columns
                    engine.timer = RoundTimer(Config.ROUND_DURATION_SEC)
                    update_dashboard(inputs_ws, dash_ws, engine, Config.ROUND_DURATION_SEC)
                    force_next_round = False
                    
            except KeyboardInterrupt:
                print("\n\n--- ⏸️  GAME PAUSED / 一時停止 ---")
                print("[n]ext round / 次のラウンドへ")
                print("[r]eset game / ゲームリセット")
                print("[q]uit / 終了")
                print("[c]ontinue / 再開")
                choice = input("Select option: ").lower().strip()
                if choice == 'n': force_next_round = True
                elif choice == 'r': game_active = False; break
                elif choice == 'q': sys.exit()
                else: continue
            
            except Exception as e:
                print(f"Error: {e}"); time.sleep(5)

if __name__ == "__main__":
    main()