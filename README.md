# SMA Media Console

A modern, high-fidelity frontend client for the Social Media Application (SMA) built with **Vue 3 (Composition API)**, **Apollo Client (Composables)**, **Vite**, and **Tailwind CSS**.

---

## Features & Pages

### 1. Media Feed
A live, real-time community feed. Features include:
* **Cursor-Based Pagination**: Load more posts dynamically as you scroll down.
* **Real-time Subscriptions**: New posts created by other users automatically trigger a floating Toast alert and appear instantly at the top of the feed using GraphQL WebSockets.

---

### 2. User Dashboard
A personal space to manage your authored content. Features include:
* **Metrics Cards**: View total posts, published counts, articles written, and system interactions.
* **Content Management**: Create new drafts, write technical articles with tags, publish posts, or delete them directly.
* **Safe Actions**: Buttons are automatically disabled during server calls (with visually disabled indicators) to prevent duplicate submissions or race conditions.

---

### 3. Unified Search
A unified interface to find database records. Features include:
* **Cross-Model Indexing**: Search for keywords simultaneously across all posts, articles, and comments.
* **Dynamic Results**: Instantly groups and displays matching records categorized with color-coded sidebar indicators (Post, Article, Comment).

---


## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Set up environment

Create a `.env` file in the root directory and specify the GraphQL HTTP and WebSocket URLs.

### 3. Start development server

```bash
npm run dev
```

---

## Code Quality & Compilation

Use the following commands to check code safety and quality:

```bash
# Run ESLint validation and auto-fix rules
npm run lint

# Validate TypeScript type safety
npm run type-check

# Compile production bundle
npm run build
```
