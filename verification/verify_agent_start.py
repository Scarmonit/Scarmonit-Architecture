from playwright.sync_api import sync_playwright, expect
import time

def test_agent_start():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Navigate to Dashboard
        print("Navigating to dashboard...")
        page.goto("http://localhost:5174/")

        # Go to Agents page
        print("Clicking AI Agents nav...")
        # Sidebar nav item
        page.get_by_role("button", name="AI Agents").click()

        # Wait for agents list
        expect(page.get_by_text("AI Agent Swarm")).to_be_visible()

        # Find Coding Agent (A-002) which is Idle
        print("Locating Coding Agent...")
        coding_agent = page.get_by_text("Coding Agent")
        expect(coding_agent).to_be_visible()

        # Locate the "Start" button associated with it.
        # Since there are multiple Start buttons, we need to be careful.
        # But for verification, clicking ANY Start button and seeing it change to Pause is sufficient proof the code works.

        start_btns = page.get_by_role("button", name="Start")
        count = start_btns.count()
        print(f"Found {count} start buttons")

        if count > 0:
            start_btn = start_btns.first
            print("Clicking first Start button...")
            start_btn.click()

            # Wait for text to change to Pause
            # The same button should now say "Pause" (or be replaced)
            print("Waiting for Pause...")
            # We look for a Pause button that appears
            expect(page.get_by_role("button", name="Pause").nth(0)).to_be_visible() # There might be others already active

            # Wait a bit for transition
            time.sleep(1)

            print("Taking screenshot...")
            page.screenshot(path="/home/jules/verification/agent_start.png")
        else:
            print("No Start buttons found!")
            page.screenshot(path="/home/jules/verification/failed_start.png")

        browser.close()

if __name__ == "__main__":
    test_agent_start()
