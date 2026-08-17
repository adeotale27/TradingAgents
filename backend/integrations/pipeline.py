"""Map TradingAgents agents onto numbered desk steps for the UI."""

from __future__ import annotations

STEPS = [
    {
        "index": 1,
        "title": "Analyst team",
        "detail": "Technical, fundamental, sentiment and news research",
        "agents": ["Market Analyst", "Sentiment Analyst", "News Analyst", "Fundamentals Analyst"],
    },
    {
        "index": 2,
        "title": "Bull vs bear debate",
        "detail": "Researchers argue both sides, then the research manager judges",
        "agents": ["Bull Researcher", "Bear Researcher", "Research Manager"],
    },
    {
        "index": 3,
        "title": "Trader proposal",
        "detail": "Turns the research plan into a Buy / Hold / Sell proposal",
        "agents": ["Trader"],
    },
    {
        "index": 4,
        "title": "Risk debate",
        "detail": "Aggressive, neutral and conservative risk views",
        "agents": ["Aggressive Analyst", "Neutral Analyst", "Conservative Analyst"],
    },
    {
        "index": 5,
        "title": "Portfolio decision",
        "detail": "Final rating the desk will stand behind",
        "agents": ["Portfolio Manager"],
    },
]


def progress_from_agents(agents: list, status: str) -> dict:
    by_name = {row.agent_name: row.status for row in agents}
    current = 1
    label = STEPS[0]["title"]
    if status == "queued":
        return {
            "step": 0,
            "total": len(STEPS),
            "title": "Queued",
            "detail": "Waiting for a free desk slot. You can cancel from Jobs.",
            "steps": STEPS,
        }
    if status == "cancelled":
        return {"step": 0, "total": len(STEPS), "title": "Cancelled", "detail": "This run was stopped.", "steps": STEPS}
    if status == "failed":
        running = next((step for step in STEPS if any(by_name.get(name) == "running" for name in step["agents"])), STEPS[-1])
        return {
            "step": running["index"],
            "total": len(STEPS),
            "title": f"Failed during {running['title']}",
            "detail": running["detail"],
            "steps": STEPS,
        }
    for step in STEPS:
        states = [by_name.get(name, "waiting") for name in step["agents"]]
        if any(state == "running" for state in states) or (any(state == "completed" for state in states) and not all(state == "completed" for state in states)):
            current = step["index"]
            label = step["title"]
            break
        if all(state == "completed" for state in states):
            current = min(step["index"] + 1, len(STEPS))
            label = STEPS[current - 1]["title"]
    if status == "completed":
        current = len(STEPS)
        label = STEPS[-1]["title"]
    return {
        "step": current,
        "total": len(STEPS),
        "title": label,
        "detail": next(item["detail"] for item in STEPS if item["index"] == current),
        "steps": STEPS,
    }
