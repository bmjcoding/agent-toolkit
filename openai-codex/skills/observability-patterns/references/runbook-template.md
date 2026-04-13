# Runbook Template

For each new service or feature that could page oncall:

## Service: {name}
**Owner:** {team}
**Dashboard:** {link}
**Logs:** {query or link}

## Alert: {alert_name}
**Severity:** P1/P2/P3
**Fires when:** {condition}
**Impact:** {what breaks for users}

### Triage Steps
1. Check {dashboard} for {metric}
2. Check logs: `{log query}`
3. If {condition A}: {action A}
4. If {condition B}: {action B}

### Escalation
If not resolved in {N} minutes, escalate to {team/person}.

### Recent Incidents
- {date}: {brief description of what happened and how it was resolved}
