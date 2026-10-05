# Plugin precedence (superpowers + ponytail + caveman + claude-mem)

Each plugin owns one layer. When they conflict, this file wins.

| Layer | Owner | Rule |
|---|---|---|
| Process (brainstorm → plan → TDD → verify) | superpowers | Only for non-trivial work: new features, multi-file changes, bugs with unknown cause. |
| Scope (how much code) | ponytail (full) | Applies to every code change, including inside superpowers plans. Plans list the minimum steps. |
| Chat prose (how much I say) | caveman | Progress updates and answers only. Never in files, specs, plans, commit bodies, code comments, or user-facing deliverables. Switch to normal mode while brainstorming or writing a plan or doc. |
| Memory | claude-mem | Run `mem-search` before brainstorming a feature that may have been tried before. |

## Rules
- **Trivial tasks** (one obvious file, no design choice): skip brainstorming and plan skills. Just do it, with ponytail scope and verification-before-completion.
- **One pipeline:** superpowers `writing-plans` / `executing-plans` / `subagent-driven-development`. Do not use claude-mem `make-plan` or `do`.
- **Review:** `requesting-code-review` for correctness, then `ponytail-review` for over-engineering. No third reviewer.
- **Debugging:** `systematic-debugging`. Fix the root cause once, in the shared place (ponytail).
- **Exploration:** `smart-explore` for structure; `cavecrew` subagents for cheap lookups that keep main context small.
- **Language:** reply to the user in Thai; technical terms stay in English. Terseness means dropping filler, not dropping Thai.
- **Never** compress a security warning, a destructive-action confirmation, or a test/CI failure report.
