import { createMachine } from "xstate";
export function createResearchMachine(ctx: any = {}) {
  return createMachine({
    id: "research",
    initial: "plan",
    states: {
      plan: { on: { APPROVE_PLAN: "search", REVISE_PLAN: "plan" } },
      search: { on: { RESULTS_READY: "browse", PAUSE: "waiting" } },
      browse: { on: { SNAPSHOTS_READY: "extract", BLOCKER: "waiting" } },
      extract: { on: { NORMALIZED: "analyze" } },
      analyze: { on: { NEED_MORE_EVIDENCE: "search", TO_AUDIT: "audit" } },
      audit: { on: { APPROVE_AUDIT: "write", REWORK: "search" } },
      write: { on: { REPORT_DRAFT: "dashboard" } },
      dashboard: { on: { DASHBOARD_READY: "done" } },
      waiting: { on: { HUMAN_DECISION: "search" } },
      done: { type: "final" }
    }
  }, { context: ctx });
}
