---
name: grilling
description: Grill the user relentlessly about a plan, decision, or idea. Use when the user wants to stress-test their thinking, or uses any 'grill' trigger phrases.
---

Interview the user relentlessly until you reach a shared understanding. Map this as a **design tree**: every decision branches into the decisions that hang off it.

**Start by pinning down what you're grilling.** Before mapping the tree, get a one-paragraph statement of the plan, decision, or idea — ask the user for it, or read it from what they've pointed you at. Don't invent the root decisions from a bare trigger; you need the actual proposal in hand first. Once you have it, derive the root decisions and begin.

Work the tree in **rounds**. The **frontier** is every decision whose prerequisites are already settled: the questions you can ask _now_ without guessing at answers you haven't heard yet. Number each question and give your recommended answer _and the reasoning behind it_ — the recommendation is what the user is stress-testing, so a bare pick with no "because" gives them nothing to push against. Then wait for the user's answers before the next round.

Order each round by **leverage**: put the decisions that unblock the most downstream branches first. If the frontier is large, ask the highest-leverage questions — up to roughly 5 or 6 in a round — and hold the rest; they're still frontier and come up next round. Don't dump twenty questions at once.

Format a round like so:

```
❓ **Q1** - **<question title>**: <question body, might be multiple paragraphs, including multiple choices>

➡️ <your recommended answer>

---

❓ **Q2** - **<question title>**: <question body, might be multiple paragraphs, including multiple choices>

➡️ <your recommended answer>
```

Each round the user answers reshapes the tree: settled decisions push the frontier outward and unblock questions that depended on them. Recompute the frontier and ask the next round. A question whose answer depends on another question still open in this round belongs to a _later_ round, not this one.

Finding _facts_ is your job, never the user's. When a frontier question needs a fact from the environment (filesystem, tools, etc.), dispatch a sub-agent to find it — use the read-only **Explore** agent, which is built for exactly this fan-out lookup; don't ask the user for anything you could look up yourself. Don't block on it: a running exploration is an unsettled prerequisite, so only the questions downstream of it wait for the sub-agent to report; ask the rest of the frontier now. The _decisions_ are the user's: put each to them and wait.

The session is done when the frontier is empty: every branch of the design tree visited, nothing left silently assumed. Do not act on it until the user confirms you have reached a shared understanding.