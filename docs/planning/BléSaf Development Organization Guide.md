# BléSaf Development Organization Guide

**Author:** Manus AI
**Date:** February 9, 2026
**Subject:** A Practical System for Managing BléSaf's Parallel Development Workstreams

---

## 1. Introduction

As a solo developer managing multiple parallel workstreams—the **Doctor/Receptionist View**, **Patient View**, **Admin View**, and the **Onboarding Process**—a structured organization system is critical. Ad-hoc development can lead to a disorganized codebase, duplicated effort, and difficulty tracking progress. 

This guide provides a comprehensive system for organizing your project, workflow, and schedule. It is based on proven industry best practices adapted for a solo developer context, focusing on three pillars:

1.  **Structure:** A scalable file and project architecture.
2.  **Workflow:** A clear process for managing tasks from idea to completion.
3.  **Schedule:** A time management strategy to ensure steady progress across all components.

## 2. Pillar 1: Project & File Structure

To manage the four interconnected components of BléSaf, we will adopt a **monorepo architecture** with a **feature-based** folder structure. This means all your code lives in a single repository, but is neatly organized into independent modules.

**Why a Monorepo?**
*   **Single Source of Truth:** One `node_modules` folder, one set of dependencies, one place to run tests.
*   **Code Sharing:** Effortlessly create and use shared components (buttons, inputs, layouts) across all four views.
*   **Simplified Refactoring:** Changes to a shared component are instantly reflected everywhere.

### Recommended Folder Structure

Based on the highly-regarded "Bulletproof React" architecture [1], your `src` directory should be organized as follows:

```plaintext
src/
├── app/              # Core application setup (routing, providers, main layout)
|
├── components/       # SHARED, REUSABLE components (e.g., Button, Input, Modal)
|
├── features/         # --- THIS IS WHERE YOUR MAIN WORK HAPPENS ---
│   ├── 1-onboarding/   # Landing page, registration, login, first steps
│   ├── 2-doctor-view/  # The queue management dashboard for doctors/secretaries
│   ├── 3-patient-view/ # The public-facing queue status page
│   └── 4-admin-view/   # The configuration panel for clinic settings
|
├── hooks/            # Shared, reusable hooks (e.g., useMediaQuery)
|
├── lib/              # External library configurations (e.g., axios, date-fns)
|
├── stores/           # Global state management (e.g., Zustand, Redux)
|
├── types/            # Shared TypeScript types used across the app
|
└── utils/            # Shared utility functions
```

### The "Features" Directory Explained

Each of your four workstreams becomes a folder inside `features`. Within each feature folder, you can have its own isolated components, hooks, and logic.

```plaintext
src/features/2-doctor-view/
├── api/         # API calls specific to the doctor view (e.g., callNextPatient)
├── components/  # Components used ONLY in the doctor view (e.g., PatientCard, WorkflowControls)
├── hooks/       # Hooks used ONLY in the doctor view (e.g., useQueueStats)
└── index.tsx    # The main entry point component for this feature
```

**The Golden Rule:** A feature should **NEVER** import from another feature. For example, `doctor-view` cannot import a file from `patient-view`. If you need to share code between them, it must be moved into a shared directory like `/components` or `/hooks`.

## 3. Pillar 2: Workflow Methodology

To manage your tasks, we will use a simple but effective Kanban-based workflow combined with a structured Git branching strategy.

### Kanban for Task Management

Use a simple project management tool like **GitHub Projects**, **Trello**, or **Notion**. Create a board with three columns:

*   **To Do:** All the tasks you need to work on for all four components.
*   **In Progress:** The 1-2 tasks you are actively working on *right now*.
*   **Done:** Completed tasks.

**Weekly Workflow:**
1.  **Monday Planning (30 mins):** Review your high-level goals. Create specific task cards for the week (e.g., "Build login form," "Implement color-coded wait times," "Create patient view layout"). Drag them into the "To Do" column.
2.  **Daily Work:** As you start a task, move its card to "In Progress".
3.  **Task Completion:** When a task is finished and the code is merged, move the card to "Done".

### Git Branching Strategy

This ensures your main codebase remains stable while you work on new features in parallel.

*   **`main` branch:** This is your stable, production-ready code. You should rarely commit directly to this.
*   **`develop` branch:** This is your integration branch. All completed features are merged here before being released to `main`.
*   **Feature branches:** For every task on your Kanban board, you create a new branch from `develop`. Use a clear naming convention: `feature/<component>-<description>`.

**Example Flow:**
1.  You want to build the new dashboard mockup.
2.  From the `develop` branch, you create a new branch: `git checkout -b feature/doctor-view-dashboard-mockup`
3.  You complete the work on this branch.
4.  You create a Pull Request (PR) to merge your feature branch back into `develop`.
5.  (As a solo dev, you can review your own PR to double-check your work before merging).
6.  Once merged, the `develop` branch now contains the new feature, and you can delete the feature branch.

## 4. Pillar 3: Scheduling & Time Management

Context switching is the biggest productivity killer for solo developers. To combat this, use a **themed-day** or **time-blocking** strategy.

Instead of trying to work on all four components every day, dedicate specific days or blocks of time to each one. This allows you to get into a state of "deep work."

### Recommended Weekly Schedule

| Day | Morning (9am - 12pm) | Afternoon (1pm - 5pm) |
| :--- | :--- | :--- |
| **Monday** | **Planning & Onboarding:** Plan the week. Work on landing page, registration, or login features. | **Onboarding:** Continue onboarding tasks. |
| **Tuesday** | **Doctor/Receptionist View:** Focus solely on the core queue management dashboard. | **Doctor/Receptionist View:** Continue dashboard development. |
| **Wednesday**| **Patient View:** Focus solely on the public-facing patient status page. | **Patient View:** Continue patient view development. |
| **Thursday** | **Admin View:** Focus on the backend configuration and settings panel. | **Admin View:** Continue admin panel development. |
| **Friday** | **Review & Refactor:** Review the week's work. Merge completed PRs. Refactor shared components. | **Buffer & Bug Fixes:** Address any bugs that came up or use this as flexible time to finish any pending tasks. |

This schedule provides structure and ensures every component gets dedicated attention each week, preventing any one part of the project from falling too far behind.

## 5. Conclusion

By implementing this three-pillar system, you will bring structure, clarity, and predictability to your development process. 

*   **Structure** (Monorepo) keeps your code clean and scalable.
*   **Workflow** (Kanban & Git) keeps your tasks organized and your codebase stable.
*   **Schedule** (Themed Days) keeps you focused and productive.

Consistency is key. Stick to this system, and you will find it much easier to manage the complexity of building BléSaf and deliver a high-quality product.

---

## References

[1] GitHub - alan2207/bulletproof-react. "Project Structure." https://github.com/alan2207/bulletproof-react/blob/master/docs/project-structure.md
