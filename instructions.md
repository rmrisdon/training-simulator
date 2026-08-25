# Product Goal
Build an interactive browser-based Tech Support Escalation & Diagnostics Simulator for training technical support specialists on complex software issues.

# Domain Context & Core Mechanics
1. **Scenario-Based Troubleshooting:** Present real-world technical support cases specific to TechSmith products (Camtasia Editor, Camtasia Snagit, Camtasia Audiate, Screencast.com, etc.) covering issues like video render failures, license activation loops, audio sync drift, and screen recording black screens.
2. **Diagnostic Decision Tree:** Provide multiple-choice diagnostic options (e.g., checking hardware acceleration, parsing log files, verifying audio sample rates, resetting registry keys/preferences).
3. **Draft Reply Workbench:** Provide an interactive text area where trainees draft customer responses for escalated tickets.
4. **Automated Feedback & Scoring:** Grade trainee responses based on empathy, clarity, step-by-step diagnostic logic, and technical accuracy.

# UI & Feature Layout
- Modern dark-mode interface built with React and Tailwind CSS.
- **Left Sidebar:** List of scenarios filtered by category and difficulty (Tier 1, Tier 2, Escalation Edge Case).
- **Main View (Split Screen):**
  - *Left Panel:* Customer Ticket details (Issue description, OS specs, application version, crash logs).
  - *Right Panel:* Interactive Diagnostic Steps and Draft Reply box with a "Submit for Review" button.
- Include a "Load Sample Scenarios" button so the app runs out-of-the-box with 3 complete, realistic technical support cases.