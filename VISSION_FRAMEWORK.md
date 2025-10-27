🚀 Carben Connect — App Rebuild Vision & Guidelines
Author: Carl Borrelli

Date: [10/27/2025]

🧭 Overview

The accidental erasing of the previous build might actually be a blessing in disguise.
It gives us a clean slate to reimagine the app from the ground up — this time without being tied to the web version’s layout or limitations.

The goal:
Build an app that feels as refined as an Apple product — simple when you want it to be, powerful when you need it to be.
It should be intuitive, responsive, and clean, balancing minimal design with deep functionality.

🧩 Design Philosophy

Simple → Complex: Start with simplicity. Let deeper features reveal themselves contextually.

Apple-like Experience: Motion, transitions, and layout hierarchy should feel deliberate.

Smart Interactions: Predictive filtering, contextual menus, and state memory.

Admin-First: Focus initial development on the Admin experience — complexity handled elegantly.

Consistency: Unified design language between app and site, but optimized for mobile interaction.

📥 Inbox Module

The previous inbox design wasn’t ideal. The rebuild is an opportunity to make it perfect.

Core Requirements

📨 Smart Sorting & Filtering: Organize messages by project and client automatically.

🔝 New Messages on Top: Maintain natural chronological order.

🔔 Unread Until Replied: Messages remain “unread” until a response is sent.

🧠 Multi-Thread Context: Enable quick switching between conversations for different projects.

Notes

This component defines the tone for UX consistency — responsive, smooth, and “native” in feel.

🏗️ Project Management Flow
1. New Project Creation

When creating a project (admin side):

Dropdown for Client Name

Dropdown or auto-fill for Client Location

Input fields for Project Details

Inline validation (prevent empty or invalid fields)

2. Draft Mode

The old system had:

A scrolling page with dropdowns for Estimate AI Import → Calculator → QuickBooks Submission

We’ll replace this with:

A tabbed or card-based layout

Streamlined workflow (no excessive scrolling)

Smooth transitions between steps

Contextual tooltips or inline explanations

3. Navigation

Bottom Menu Bar: Persistent across all screens

Top Context Bar: Appears when in specific modes (e.g., Draft Mode)

Think adaptive, not cluttered.

📅 Calendar Module (Future Phase)

We haven’t implemented this yet, but it will be critical for task and schedule management.

Goals

Full two-way sync with database and events

Easy integration with project milestones and reminders

Clean, scrollable interface that supports weekly/monthly views

TBD

How calendar data links with QuickBooks and internal project states

Whether events are stored locally or via Firestore/Firebase

🔗 QuickBooks & Database Sync

Currently, the website handles QuickBooks and database connections.
For the app:

Connection must be persistent and reliable.

If constant connection isn’t ideal, trigger automatic re-connection whenever there’s user activity.

Consider background sync jobs or event-driven architecture (e.g., when “Estimate Sent” or “Project Updated”).

⚙️ The goal is never to see a “connection lost” message.

🧱 Development Focus

Phase 1 — Admin Experience:
Core logic, database structure, QuickBooks integration, and messaging layer.

Phase 2 — Client Experience:
Refine UI, permissions, and feedback channels once the admin workflow is seamless.

🧭 Initial Layout Proposal
Bottom Menu Bar
Projects | Inbox | Home | Clients | More/Menu

Optional Top Bar (Contextual)

Appears in:

Draft Mode

Edit Views

Calendar (navigation/filter tools)

🧠 Guiding Principles

No idea is set in stone — everything is open to iteration.

Build for clarity, not complexity.

The admin side will reveal most design challenges — solving them elegantly will shape the entire system.

Encourage creative problem-solving — think outside the box when it makes sense.

💡 Developer Notes

Suggested Stack (if continuing Claude Code base):

Frontend: React Native (Expo)

Backend: Firebase (Auth + Firestore + Functions)

Integrations: QuickBooks API, OpenAI, Whisper

Design: Tailwind (or NativeWind) + Apple-style animation hierarchy

✅ Next Steps

Scaffold the new project (expo init or Claude project seed).

Implement persistent bottom navigation bar.

Build the Inbox module skeleton.

Create mock data for Projects and Clients.

Draft Mode UI prototype.

🗒️ Notes to Future Devs

This document isn’t a strict roadmap — it’s a vision framework.
Every detail here is up for discussion, but the spirit of the project should remain:
Clean. Smart. Effortless.
