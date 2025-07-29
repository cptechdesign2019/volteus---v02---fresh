Testing 1.2 in the editor.
# Project Setup – Master To-Do List

> This list is divided into two phases. We will complete all documentation first, then move to implementation.

---

## **Phase 1: Standards Documentation**

- [x] **Tech-Stack.md**
  - Add “State Management: Zustand”
  - Add “Testing: Vitest (unit/integration) & Playwright (E2E)”
  - Note background jobs via **Supabase Edge Functions**
  - Document design-token strategy (Tailwind CSS variables)
- [x] **Context Sections**
  - Align context for `code-style.md` and `best-practices.md`
- [x] **Code-Style.md**
  - [x] Switch naming convention to **camelCase**
  - [x] Insert sample `.eslintrc`, `.prettierrc`, and `tailwind.config.js` snippets
  - [x] Add TypeScript-specific rules (no `any`, `interface` vs `type`, etc.)
  - [x] Add TSDoc comment guidelines
  - [x] Add Husky + lint-staged pre-commit section
  - [x] Move long example snippets to Appendix and clean Quick Wins
  - [x] Harmonise heading numbering in code-style.md and best-practices.md
- [ ] Review the project standards in the .docs/ folder (symlinked from ~/.agent-os/standards/). For project-specific changes, create project-overrides.md instead of editing the symlinked files.

---

## **Phase 2: Project Implementation (COMPLETED)**

- [x] **Dependency Installation**
  - [x] Install and configure ESLint, Prettier, and Tailwind plugins.
  - [x] Install and configure Vitest & Playwright.
  - [x] Install and configure Husky & lint-staged.
- [x] **CI/CD Setup**
  - [x] Update GitHub Actions workflow to run all tests and checks.
- [x] **Component & Doc Infrastructure**
  - [x] Initialize Storybook.
  - [x] Initialize Docusaurus.
  - [x] **Note:** Remember to bookmark local development URLs (e.g., Storybook, Docusaurus).
- [x] **Initial Code Setup & Enhancements**
  - [x] Add Next.js "Hello World" boilerplate.
  - [x] Pre-configure Tailwind CSS with shadcn/ui.
  - [x] Create example tests (Vitest & Playwright).
  - [x] Create example Supabase Edge Function.

---

## **Development Tooling Decisions**

- [x] **Voice Dictation:** "Speech to Text with Whisper" (by Speak-Y).
  - *Reason:* The built-in "VS Code Speech" extension is incompatible with the current WSL audio bridge configuration. The Whisper-based extension bypasses this by using `ffmpeg` for local recording and sending the audio to the OpenAI API for transcription, which is a more robust solution for this environment.
  - *Setup:*
    - `sudo apt install ffmpeg -y` in the WSL terminal.
    - Install the extension from the VS Code Marketplace.
    - Add an OpenAI API key to the extension's settings.
  - *Usage:*
    - `Ctrl + Shift + N` to dictate into the chat.
    - `Ctrl + Shift + M` to dictate into the editor.
  - *Configuration Notes:*
    - Set the Language to English for best results.
    - Adjust the "Silence Detection" timeout to 5000ms (5 seconds), as the default of 3 seconds can be too short.

---

## **Project Complete: Agent OS Starter Kit**

This document can be archived. The `clearpoint-agent-os-setup-log.md` now serves as the primary documentation for this template. 