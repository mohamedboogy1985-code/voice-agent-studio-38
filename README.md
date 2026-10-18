# Voice Agent Studio (38)

Build a polished, functional full-stack web app called “Voice Agents Assistant” for creating and testing AI voice agents. Use Lovable's default full-stack TypeScript stack with React, Tailwind and shadcn/ui. Create a modern responsive dashboard with sidebar navigation and English-first UI, Arabic language option and RTL-ready layout.

Implement:
1. Dashboard with agent count, calls today, success rate, average duration, recent activity and charts clearly marked as demo data.
2. Agents management: create/edit/duplicate/archive/delete, search and filters. Each agent has name, description, system instructions, greeting, language (English/Arabic), voice, tone, response style, interruption handling and tools/actions.
3. Agent builder with editable prompt and greeting, voice/language controls, test conversation panel, transcript, status and start/end/reset controls.
4. Browser demo voice using speech recognition and speech synthesis when supported, microphone permission/error feedback, stop/interruption controls and graceful text-chat fallback. Clearly label demo mode and never pretend a real production AI call happened.
5. Calls history with search/filter, status, duration, date, agent, transcript and outcome.
6. Knowledge base CRUD with search and attach entries to agents.
7. Analytics with date filters and charts for call volume, duration, outcomes and agent usage.
8. Settings for workspace, language, audio and integration status.
9. Seed realistic sample agents, call records, transcripts and knowledge entries, visibly marked as sample data. Persist demo changes in local storage.
10. Production voice integration boundary: server-side only, documented environment variables, never expose API keys in browser code, and clearly show when live provider credentials are not configured.

All navigation and primary actions must work. Include validation, empty/loading/error states, toast feedback, keyboard accessibility and responsive design. Prioritize a polished usable application, not a static mockup.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/966a9a66-ed17-476b-bffc-59e19acb80c0).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
