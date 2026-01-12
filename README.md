# AI-Powered PR Review Assistant

> An intelligent code review assistant that learns from your coding patterns and provides personalized feedback on GitHub Pull Requests

## 🎯 Project Overview

### Problem Statement
Manual code reviews are time-consuming and often catch the same repetitive issues. Developers need an automated assistant that not only identifies common problems but learns from their personal coding style and past reviews to provide increasingly relevant suggestions over time.

### Solution
An AI-powered PR review assistant that integrates with GitHub, analyzes pull requests using LLMs, and continuously learns from your feedback to provide personalized, actionable code review suggestions.

### Key Differentiators
- **Personalized Learning**: Adapts to YOUR coding style, not generic rules
- **Context-Aware**: Remembers similar past PRs and what worked
- **Actionable Feedback**: Provides specific code improvements, not just criticism
- **Continuous Improvement**: Gets smarter with every PR you review

---

## 📋 Project Scope

### In Scope (MVP)
1. **GitHub Integration**
   - OAuth authentication with GitHub
   - Webhook listening for PR events (open, update, commit)
   - Fetch PR diffs and file changes
   - Post review comments back to PRs

2. **AI Code Analysis**
   - LLM-powered code review (bugs, code smells, improvements)
   - Pattern-based detection (secrets, console.logs, TODOs)
   - Severity classification (critical, high, medium, low)
   - Generate actionable suggestions with code examples

3. **Learning System**
   - Store past PR reviews and outcomes
   - Track accepted vs rejected suggestions
   - Vector embeddings for semantic code similarity
   - Improve recommendations based on user behavior

4. **User Dashboard**
   - View all reviewed PRs
   - See metrics (suggestions accepted, common issues)
   - Configure review preferences
   - Manage connected repositories

5. **Review Features**
   - Complexity scoring for PRs
   - Estimated review time
   - File-level and line-level comments
   - Summarized review with key findings

### Out of Scope (Future Enhancements)
- Team collaboration features
- Multi-language support beyond JavaScript/TypeScript/Python
- CI/CD pipeline integration
- Self-hosted model deployment
- Browser extension
- IDE plugins
- Automated PR merging

### Success Metrics
- Time to review PRs reduced by 30%+
- 70%+ suggestion acceptance rate
- Detects 90%+ of common security issues (hardcoded secrets, etc.)
- User actively uses it for 80%+ of their PRs

---

## 🏗️ System Architecture

### High-Level Architecture
```
┌─────────────────┐
│   GitHub API    │
│   (Webhooks)    │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────┐
│       Next.js Application           │
│  ┌─────────────────────────────┐   │
│  │     API Routes              │   │
│  │  - /api/webhook             │   │
│  │  - /api/auth/github         │   │
│  │  - /api/reviews             │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │   Frontend (React)          │   │
│  │  - Dashboard                │   │
│  │  - PR Review History        │   │
│  │  - Settings                 │   │
│  └─────────────────────────────┘   │
└──────────┬─────────────┬────────────┘
           │             │
           ▼             ▼
┌──────────────┐  ┌──────────────┐
│  PostgreSQL  │  │  Vector DB   │
│  (Prisma)    │  │  (Pinecone)  │
│              │  │              │
│ - Users      │  │ - Code       │
│ - PRs        │  │   Embeddings │
│ - Reviews    │  │ - Pattern    │
│ - Feedback   │  │   Vectors    │
└──────────────┘  └──────────────┘
           │
           ▼
┌──────────────────────┐
│   Claude API /       │
│   OpenAI API         │
│                      │
│ - Code Analysis      │
│ - Review Generation  │
│ - Embeddings         │
└──────────────────────┘
```

### Data Flow

**1. PR Creation/Update Flow:**
```
GitHub PR Created
    ↓
Webhook triggers /api/webhook
    ↓
Fetch PR details (diff, files, commits)
    ↓
Quick Pattern Analysis (regex checks)
    ↓
Send to LLM for deep analysis
    ↓
Query Vector DB for similar past PRs
    ↓
Generate combined review
    ↓
Post comments to GitHub
    ↓
Store review in PostgreSQL
    ↓
Store code embeddings in Vector DB
```

**2. Learning Flow:**
```
User responds to suggestions (accept/reject)
    ↓
GitHub webhook captures resolution
    ↓
Update suggestion feedback in database
    ↓
Recalculate pattern weights
    ↓
Update vector embeddings with accepted patterns
    ↓
Future reviews use updated preferences
```

---

## 🛠️ Technology Stack

### Frontend
- **Next.js 14** (App Router)
  - Server components for better performance
  - API routes for backend logic
  - Built-in optimization (image, font loading)

- **React 18**
  - Component-based UI
  - Hooks for state management

- **TypeScript**
  - Type safety across codebase
  - Better IDE support

- **Tailwind CSS**
  - Utility-first styling
  - Responsive design

- **shadcn/ui**
  - Pre-built accessible components
  - Customizable design system

- **Recharts**
  - Dashboard visualizations
  - Metrics and trends

### Backend (Next.js API Routes)
- **Next.js API Routes**
  - Serverless functions
  - Easy deployment on Vercel

- **Octokit (@octokit/rest)**
  - Official GitHub API client
  - Handles authentication, webhooks, API calls

- **Prisma**
  - Type-safe database ORM
  - Migration management
  - Easy querying

### AI/LLM Layer
- **LangChain.js**
  - LLM orchestration
  - Chain complex workflows
  - Memory management

- **Anthropic Claude API**
  - Primary LLM for code analysis
  - Excellent code understanding
  - Long context window (200K tokens)

- **OpenAI API** (Alternative/Complementary)
  - GPT-4 for code review
  - Embeddings API for vector representations
  - Function calling support

### Database
- **PostgreSQL**
  - Relational data (users, PRs, reviews)
  - ACID compliance
  - Hosted on Supabase or Railway

- **Prisma ORM**
  - Schema definition
  - Type-safe queries
  - Migration tools

### Vector Database
- **Pinecone** (Recommended for MVP)
  - Managed vector database
  - Fast similarity search
  - Free tier (100K vectors)

- **Alternatives:**
  - Supabase with pgvector extension
  - ChromaDB (self-hosted)

### Authentication
- **NextAuth.js**
  - OAuth with GitHub
  - Session management
  - Secure token storage

### Deployment
- **Vercel**
  - Next.js optimized hosting
  - Automatic deployments
  - Environment variables
  - Edge functions support

### Development Tools
- **ESLint + Prettier**
  - Code quality
  - Consistent formatting

- **Husky + lint-staged**
  - Pre-commit hooks
  - Automated checks

- **Jest + React Testing Library**
  - Unit and integration tests

---

## 📁 Project Structure
```
pr-review-assistant/
│
├── prisma/
│   ├── schema.prisma              # Database schema
│   └── migrations/                # Database migrations
│
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   │   └── page.tsx       # Login page
│   │   │   └── callback/
│   │   │       └── page.tsx       # OAuth callback
│   │   │
│   │   ├── (dashboard)/
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx       # Main dashboard
│   │   │   ├── reviews/
│   │   │   │   ├── page.tsx       # Review history
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx   # Individual review
│   │   │   ├── repositories/
│   │   │   │   └── page.tsx       # Manage repos
│   │   │   └── settings/
│   │   │       └── page.tsx       # User settings
│   │   │
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   │   └── [...nextauth]/
│   │   │   │       └── route.ts   # NextAuth config
│   │   │   │
│   │   │   ├── webhook/
│   │   │   │   └── route.ts       # GitHub webhook handler
│   │   │   │
│   │   │   ├── reviews/
│   │   │   │   ├── route.ts       # List reviews
│   │   │   │   └── [id]/
│   │   │   │       ├── route.ts   # Get review
│   │   │   │       └── feedback/
│   │   │   │           └── route.ts # Update feedback
│   │   │   │
│   │   │   └── repositories/
│   │   │       ├── route.ts       # List/add repos
│   │   │       └── [id]/
│   │   │           └── webhook/
│   │   │               └── route.ts # Setup webhook
│   │   │
│   │   ├── layout.tsx             # Root layout
│   │   └── page.tsx               # Landing page
│   │
│   ├── lib/
│   │   ├── github/
│   │   │   ├── octokit.ts         # Octokit client setup
│   │   │   ├── webhooks.ts        # Webhook verification
│   │   │   ├── pr-fetcher.ts      # Fetch PR data
│   │   │   └── comment-poster.ts  # Post comments
│   │   │
│   │   ├── ai/
│   │   │   ├── claude.ts          # Claude API client
│   │   │   ├── embeddings.ts      # Generate embeddings
│   │   │   ├── prompts.ts         # Review prompts
│   │   │   └── langchain.ts       # LangChain setup
│   │   │
│   │   ├── analysis/
│   │   │   ├── pattern-matcher.ts # Regex-based checks
│   │   │   ├── complexity.ts      # Complexity scoring
│   │   │   ├── reviewer.ts        # Main review orchestrator
│   │   │   └── similarity.ts      # Find similar PRs
│   │   │
│   │   ├── vector/
│   │   │   ├── pinecone.ts        # Pinecone client
│   │   │   ├── store.ts           # Store embeddings
│   │   │   └── query.ts           # Similarity search
│   │   │
│   │   ├── db/
│   │   │   ├── prisma.ts          # Prisma client
│   │   │   ├── users.ts           # User operations
│   │   │   ├── reviews.ts         # Review operations
│   │   │   └── feedback.ts        # Feedback operations
│   │   │
│   │   └── utils/
│   │       ├── diff-parser.ts     # Parse git diffs
│   │       ├── logger.ts          # Logging utility
│   │       └── validators.ts      # Input validation
│   │
│   ├── components/
│   │   ├── ui/                    # shadcn/ui components
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── badge.tsx
│   │   │   └── ...
│   │   │
│   │   ├── dashboard/
│   │   │   ├── stats-card.tsx     # Metrics cards
│   │   │   ├── recent-reviews.tsx # Recent activity
│   │   │   └── charts.tsx         # Visualization
│   │   │
│   │   ├── reviews/
│   │   │   ├── review-list.tsx    # List of reviews
│   │   │   ├── review-card.tsx    # Single review card
│   │   │   ├── suggestion-item.tsx# Individual suggestion
│   │   │   └── code-diff.tsx      # Code diff viewer
│   │   │
│   │   └── layout/
│   │       ├── navbar.tsx         # Navigation
│   │       ├── sidebar.tsx        # Side navigation
│   │       └── footer.tsx         # Footer
│   │
│   ├── types/
│   │   ├── github.ts              # GitHub API types
│   │   ├── review.ts              # Review types
│   │   └── database.ts            # Database types
│   │
│   └── config/
│       ├── site.ts                # Site configuration
│       └── constants.ts           # App constants
│
├── public/
│   ├── images/
│   └── icons/
│
├── .env.local                     # Environment variables
├── .env.example                   # Example env file
├── .eslintrc.json                 # ESLint config
├── .prettierrc                    # Prettier config
├── next.config.js                 # Next.js config
├── tailwind.config.ts             # Tailwind config
├── tsconfig.json                  # TypeScript config
├── package.json                   # Dependencies
└── README.md                      # This file
```

---

## 🚀 Implementation Guide

### Phase 1: Project Setup & Foundation (Week 1)

#### Step 1.1: Initialize Next.js Project
**Goal:** Set up the basic Next.js application with TypeScript and essential dependencies.

**Tasks:**
1. Create new Next.js project with TypeScript
2. Install core dependencies (Tailwind, shadcn/ui, Prisma, Octokit)
3. Set up ESLint and Prettier
4. Configure environment variables structure
5. Set up Git repository

**Key Decisions:**
- Use Next.js 14 App Router (not Pages Router)
- Use TypeScript strict mode
- Use pnpm or npm for package management

**Deliverables:**
- Running Next.js app on localhost:3000
- Clean project structure
- Environment variables template

---

#### Step 1.2: Database Setup
**Goal:** Set up PostgreSQL database and define schema.

**Tasks:**
1. Create Supabase or Railway account
2. Provision PostgreSQL database
3. Define Prisma schema with core tables:
   - Users (id, github_id, username, access_token, avatar_url)
   - Repositories (id, user_id, repo_name, owner, webhook_id, is_active)
   - PullRequests (id, repo_id, pr_number, title, author, status, url)
   - Reviews (id, pr_id, complexity_score, total_suggestions, created_at)
   - Suggestions (id, review_id, type, severity, file_path, line_number, description, code_snippet, was_accepted)
4. Run initial migration
5. Set up Prisma Client

**Key Decisions:**
- Use UUID for primary keys
- Index frequently queried fields (github_id, pr_number)
- Use enums for status and severity

**Deliverables:**
- Working database connection
- Prisma schema file
- Seed script for test data

---

#### Step 1.3: GitHub OAuth Authentication
**Goal:** Allow users to log in with GitHub and store access tokens securely.

**Tasks:**
1. Create GitHub OAuth App in GitHub settings
2. Install and configure NextAuth.js
3. Implement GitHub provider
4. Create login page with "Sign in with GitHub" button
5. Handle OAuth callback
6. Store user data in database
7. Create protected routes middleware
8. Implement session management

**Key Decisions:**
- Request scopes: `repo`, `read:user`, `write:repo_hook`
- Session strategy: JWT or database sessions
- Token encryption for security

**Deliverables:**
- Working GitHub OAuth flow
- Protected dashboard route
- User session management

---

#### Step 1.4: GitHub Webhook Setup
**Goal:** Listen for PR events from GitHub.

**Tasks:**
1. Create `/api/webhook` endpoint
2. Implement webhook signature verification
3. Set up Octokit client with user's access token
4. Create function to register webhooks on repositories
5. Handle webhook events: `pull_request` (opened, synchronize, closed)
6. Parse webhook payload
7. Store PR data in database
8. Add error handling and logging

**Key Decisions:**
- Webhook secret generation and storage
- Event filtering (which events to process)
- Rate limiting considerations

**Deliverables:**
- Working webhook endpoint
- Webhook registration UI in dashboard
- Successfully receiving PR events

---

### Phase 2: Core Analysis Engine (Week 2)

#### Step 2.1: PR Data Fetching
**Goal:** Fetch complete PR data including diffs and file changes.

**Tasks:**
1. Create `pr-fetcher.ts` service
2. Implement functions to fetch:
   - PR metadata (title, description, author)
   - List of changed files
   - File diffs (additions, deletions)
   - Commit messages
3. Parse diff format into structured data
4. Handle large PRs (pagination, limits)
5. Extract code context (surrounding lines)

**Key Decisions:**
- Diff format: unified diff vs. split diff
- File size limits (skip very large files)
- Binary file handling

**Deliverables:**
- Structured PR data object
- Diff parser utility
- File change analysis

---

#### Step 2.2: Pattern-Based Analysis
**Goal:** Implement quick, rule-based checks for common issues.

**Tasks:**
1. Create `pattern-matcher.ts` service
2. Implement regex patterns for:
   - Hardcoded secrets (API keys, passwords, tokens)
   - Console.log and debugger statements
   - TODO and FIXME comments
   - Commented-out code
   - Large functions (complexity indicators)
   - Missing error handling (try/catch)
3. Create severity classification system
4. Generate actionable suggestions
5. Add configuration for custom patterns

**Key Decisions:**
- Pattern priority (which to check first)
- False positive handling
- Language-specific patterns

**Deliverables:**
- Pattern matching engine
- List of detected issues with locations
- Configurable rules system

---

#### Step 2.3: LLM Integration for Code Review
**Goal:** Send code to Claude for intelligent analysis.

**Tasks:**
1. Set up Anthropic Claude API client
2. Create review prompt template including:
   - System prompt (you are a code reviewer)
   - Code context (files, diffs)
   - Instructions (find bugs, suggest improvements)
   - Output format (structured JSON)
3. Implement LangChain workflow:
   - Input: PR diff + context
   - Process: Send to Claude
   - Output: Structured suggestions
4. Handle API rate limits and retries
5. Stream responses for large PRs
6. Parse and validate LLM output

**Key Decisions:**
- Prompt engineering strategy
- Temperature setting (0.3 for consistent analysis)
- Max tokens per request
- Structured output format (JSON schema)

**Sample Prompt Structure:**
```
System: You are an expert code reviewer. Analyze the following code changes...

Context:
- File: src/components/Button.tsx
- Change: Added new prop 'variant'
- Lines: 15-30

Instructions:
1. Check for bugs and logic errors
2. Identify code smells
3. Suggest improvements
4. Check error handling
5. Verify type safety

Output as JSON: { suggestions: [...] }
```

**Deliverables:**
- Working Claude API integration
- Structured review output
- Error handling for API failures

---

#### Step 2.4: Review Orchestration
**Goal:** Combine pattern matching and LLM analysis into unified review.

**Tasks:**
1. Create `reviewer.ts` orchestrator
2. Implement review workflow:
   - Fetch PR data
   - Run pattern analysis (fast checks)
   - Send to LLM for deep analysis
   - Combine results
   - Remove duplicates
   - Prioritize by severity
3. Calculate complexity score
4. Estimate review time
5. Generate review summary
6. Structure output for GitHub comments

**Key Decisions:**
- Parallel vs. sequential execution
- Deduplication strategy
- Comment grouping (file-level vs. line-level)

**Deliverables:**
- Complete review generation pipeline
- Unified review format
- Priority-sorted suggestions

---

#### Step 2.5: Post Comments to GitHub
**Goal:** Automatically post review comments on PRs.

**Tasks:**
1. Create `comment-poster.ts` service
2. Format suggestions as GitHub review comments
3. Group comments by file
4. Handle inline comments (specific line numbers)
5. Add review summary comment
6. Implement comment threading
7. Add reactions/formatting (emojis for severity)
8. Handle comment update (edit if already exists)

**Key Decisions:**
- Single review vs. multiple comments
- Comment format and styling
- Update strategy (append vs. replace)

**Sample Comment Format:**
```markdown
## 🤖 AI Review Summary

Analyzed 5 files with 234 lines changed.

**Findings:**
- 🔴 2 Critical issues
- 🟡 3 Suggestions
- 🟢 1 Nitpick

---

### 🔴 Critical: Potential SQL Injection
**File:** `src/api/users.ts:42`

The query is vulnerable to SQL injection...

**Suggested fix:**
[code block with fix]
```

**Deliverables:**
- Formatted comments on GitHub
- Review summary with metrics
- Professional, helpful tone

---

### Phase 3: Learning & Memory System (Week 3)

#### Step 3.1: Vector Database Setup
**Goal:** Store code embeddings for similarity search.

**Tasks:**
1. Create Pinecone account and index
2. Set up Pinecone client in `pinecone.ts`
3. Generate embeddings using OpenAI Embeddings API
4. Create embedding pipeline:
   - Input: code snippet + context
   - Process: Generate vector
   - Output: Store in Pinecone with metadata
5. Implement similarity search
6. Test retrieval accuracy

**Key Decisions:**
- Embedding model (text-embedding-3-small)
- Vector dimensions (1536)
- Metadata to store (file, function name, outcome)
- Index namespaces (per-user or global)

**Metadata Structure:**
```json
{
  "id": "pr_123_file_abc",
  "user_id": "user_xyz",
  "pr_number": 123,
  "file_path": "src/utils/auth.ts",
  "function_name": "validateToken",
  "code_snippet": "...",
  "suggestion_accepted": true,
  "timestamp": "2024-01-15"
}
```

**Deliverables:**
- Working Pinecone integration
- Embedding generation pipeline
- Similarity search functionality

---

#### Step 3.2: Store PR Review History
**Goal:** Save every review and user feedback for learning.

**Tasks:**
1. After posting review, store in database:
   - PR details
   - Generated suggestions
   - Pattern matches found
   - LLM responses
2. Track suggestion lifecycle:
   - When suggestion was made
   - When user responded (accept/reject/ignore)
   - Final outcome (applied in code)
3. Generate embeddings for accepted suggestions
4. Store in vector database
5. Index for fast retrieval

**Key Decisions:**
- When to generate embeddings (immediately or batch)
- How to detect suggestion acceptance (commit parsing)
- Data retention policy

**Deliverables:**
- Complete review history in database
- Embeddings for all accepted suggestions
- Queryable learning dataset

---

#### Step 3.3: Feedback Loop Implementation
**Goal:** Capture and use user feedback to improve future reviews.

**Tasks:**
1. Add feedback buttons to GitHub comments
   - 👍 Helpful suggestion
   - 👎 Not helpful
   - 🤷 Unsure
2. Create `/api/reviews/[id]/feedback` endpoint
3. Update suggestion records with feedback
4. Recalculate pattern weights:
   - If pattern suggestion accepted → increase weight
   - If rejected → decrease weight
5. Update LLM prompts based on preferences
6. Store user preferences in database

**Preference Examples:**
- "User prefers async/await over promises"
- "User ignores console.log warnings"
- "User values performance suggestions"

**Key Decisions:**
- Feedback collection method (GitHub reactions vs. custom UI)
- Weight adjustment algorithm
- Minimum feedback threshold before adapting

**Deliverables:**
- Feedback collection system
- Dynamic weight adjustment
- Personalized review logic

---

#### Step 3.4: Similarity Search Integration
**Goal:** Find and reference similar past PRs during review.

**Tasks:**
1. When analyzing new PR:
   - Generate embedding for code changes
   - Query vector database for similar code
   - Retrieve top 5 similar past situations
2. Include similar PR context in LLM prompt:
   - "In a similar PR, this pattern caused issues..."
   - "Last time, you preferred this approach..."
3. Show similar PRs in review comment
4. Use past outcomes to influence suggestions

**Enhanced Prompt with Context:**
```
You are reviewing a PR. Here's relevant context:

Similar past code:
1. PR #89 - User refactored similar auth logic
   - Outcome: Accepted suggestion to use bcrypt
   - Lesson: User values security over convenience

2. PR #112 - Similar database query pattern
   - Outcome: Rejected suggestion to use ORM
   - Lesson: User prefers raw SQL for complex queries

Now analyze this new PR considering these preferences...
```

**Deliverables:**
- Similarity search in review flow
- Context-enriched prompts
- Referenced past PRs in comments

---

### Phase 4: Dashboard & Polish (Week 4)

#### Step 4.1: User Dashboard
**Goal:** Create intuitive interface for managing reviews and settings.

**Tasks:**
1. Build dashboard layout with navigation
2. Create overview cards:
   - Total PRs reviewed
   - Suggestions accepted rate
   - Time saved
   - Most common issues found
3. Add recent reviews list
4. Show charts/graphs:
   - Reviews over time
   - Suggestion acceptance trend
   - Common issue categories
5. Make it responsive (mobile-friendly)

**Components to Build:**
- `StatsCard` - Display metric with icon
- `RecentReviews` - List of recent PRs
- `TrendChart` - Line chart of metrics
- `IssueDistribution` - Pie chart of issue types

**Deliverables:**
- Functional dashboard page
- Real-time metrics
- Visualizations

---

#### Step 4.2: Review History Page
**Goal:** Let users browse past reviews and feedback.

**Tasks:**
1. Create `/reviews` page
2. List all reviews with:
   - PR title and number
   - Repository name
   - Review date
   - Number of suggestions
   - Status (pending, completed)
3. Add filters:
   - By repository
   - By date range
   - By status
4. Implement search functionality
5. Click through to individual review detail
6. Show which suggestions were accepted/rejected

**Deliverables:**
- Review history page with filters
- Detailed review view
- Search functionality

---

#### Step 4.3: Repository Management
**Goal:** Let users connect/disconnect repositories.

**Tasks:**
1. Create `/repositories` page
2. List all user's GitHub repositories
3. Show connection status (webhook active/inactive)
4. Add "Connect" button to enable reviews
5. Implement webhook creation flow
6. Add "Disconnect" button to remove webhook
7. Show webhook health status
8. Handle permissions (verify repo access)

**Deliverables:**
- Repository management UI
- Webhook enable/disable functionality
- Connection status indicators

---

#### Step 4.4: Settings & Customization
**Goal:** Let users customize review behavior.

**Tasks:**
1. Create `/settings` page with tabs:
   - **General:** Theme, notifications
   - **Review Preferences:** Severity thresholds, comment style
   - **Patterns:** Enable/disable specific checks
   - **Custom Rules:** Add user-defined patterns
   - **API Keys:** Manage integrations
2. Implement preference saving
3. Add custom rule builder:
   - Regex pattern input
   - Severity selection
   - Test regex against sample code
4. Allow disabling specific suggestion types
5. Save preferences to database
6. Apply preferences in review logic

**Deliverables:**
- Comprehensive settings page
- Custom rule builder
- Preference persistence

---

#### Step 4.5: Complexity Scoring & Metrics
**Goal:** Add intelligent PR complexity analysis.

**Tasks:**
1. Implement complexity calculator:
   - Lines of code changed
   - Number of files touched
   - Cyclomatic complexity
   - Number of functions modified
   - Test coverage changes
2. Calculate estimated review time
3. Generate complexity score (1-10)
4. Add color coding (green/yellow/red)
5. Show complexity in PR comment
6. Track complexity trends over time

**Scoring Algorithm:**
```typescript
complexity_score = (
  (lines_changed / 100) * 2 +
  (files_modified * 0.5) +
  (cyclomatic_complexity / 10) +
  (missing_tests ? 2 : 0)
)

estimated_time = complexity_score * 5 // minutes
```

**Deliverables:**
- Complexity scoring system
- Estimated review time
- Visual indicators in UI

---

#### Step 4.6: Error Handling & Logging
**Goal:** Add robust error handling and monitoring.

**Tasks:**
1. Implement centralized error logger
2. Add try-catch blocks to all async operations
3. Create error pages (404, 500)
4. Add toast notifications for user actions
5. Implement retry logic for API calls
6. Log errors to console/service (Sentry optional)
7. Add webhook validation and error responses
8. Create health check endpoint

**Error Scenarios to Handle:**
- GitHub API rate limiting
- Claude API failures
- Database connection issues
- Webhook signature validation failures
- Invalid PR data
- Large file processing

**Deliverables:**
- Comprehensive error handling
- User-friendly error messages
- Logging system

---

#### Step 4.7: Testing & Quality Assurance
**Goal:** Ensure reliability through testing.

**Tasks:**
1. Write unit tests for core functions:
   - Diff parser
   - Pattern matcher
   - Review orchestrator
2. Create integration tests:
   - Webhook handling
   - Database operations
   - API endpoints
3. Test edge cases:
   - Empty PRs
   - Binary files
   - Very large PRs
   - Merge conflicts
4. Manual testing:
   - Create test PRs
   - Verify comments appear
   - Check feedback loop
5. Performance testing:
   - Measure response times
   - Check memory usage

**Testing Tools:**
- Jest for unit tests
- Supertest for API testing
- React Testing Library for components

**Deliverables:**
- Test suite with 70%+ coverage
- Documented edge cases
- Performance benchmarks

---

#### Step 4.8: Deployment
**Goal:** Deploy application to production.

**Tasks:**
1. Set up Vercel project
2. Configure environment variables in Vercel
3. Connect GitHub repository for auto-deploy
4. Set up production database
5. Create production Pinecone index
6. Configure custom domain (optional)
7. Set up monitoring (Vercel Analytics)
8. Test production deployment
9. Update GitHub OAuth callback URLs

**Environment Variables Needed:**