# Codepackr — AI Agents, Prompts & Skills

This folder defines how AI assistants and contributors must work on **Codepackr** (`codepackr.com`).

---

## Quick Start

1. Read project rules: [`instructions.md`](instructions.md) and [`copilot-instructions.md`](copilot-instructions.md)
2. Follow the tool SOP: [`skills/add-new-tool.md`](skills/add-new-tool.md)
3. For docs: [`skills/update-tool-docs.md`](skills/update-tool-docs.md) and [`skills/sync-wiki-and-readme.md`](skills/sync-wiki-and-readme.md)

---

## Agents (Roles)

| Agent | File | Use when |
|-------|------|----------|
| **Core Engineer** | [`agents/core-engineer.yml`](agents/core-engineer.yml) | Formatters, converters, validators, crypto, EDI, TypeScript, privacy |
| **UI Architect** | [`agents/ui-architect.yml`](agents/ui-architect.yml) | Layout, design system, accessibility, tool UX |
| **SEO Specialist** | [`agents/seo-specialist.yml`](agents/seo-specialist.yml) | Metadata, sitemaps, IndexNow, README / wiki listings |

Each agent references its detailed prompt in `prompts/`.

---

## Prompts

| Prompt | File |
|--------|------|
| Core Engineer | [`prompts/core-engineer.prompt.md`](prompts/core-engineer.prompt.md) |
| UI Architect | [`prompts/ui-architect.prompt.md`](prompts/ui-architect.prompt.md) |
| SEO Specialist | [`prompts/seo-specialist.prompt.md`](prompts/seo-specialist.prompt.md) |

---

## Skills (SOPs)

| Skill | File | Purpose |
|-------|------|---------|
| **Add New Tool** | [`skills/add-new-tool.md`](skills/add-new-tool.md) | Mandatory step-by-step for every new tool |
| **Update Tool Docs** | [`skills/update-tool-docs.md`](skills/update-tool-docs.md) | Keep tool documentation accurate |
| **Sync Wiki & README** | [`skills/sync-wiki-and-readme.md`](skills/sync-wiki-and-readme.md) | Keep wiki and README in sync |

---

## Global Rules

- [`copilot-instructions.md`](copilot-instructions.md) and [`instructions.md`](instructions.md) — Golden rules
- Privacy: 100% client-side only. Never transmit user payloads off-device.
- All tools must remain fast, private, and consistent with the Codepackr design system.

Never skip the add-new-tool SOP. Never break the privacy guarantee.
