# FoodMatrix Frontend

The FoodMatrix web application is the Next.js workspace used by restaurant staff and Operations users. It provides ordering, kitchen, cashier, inventory, workforce, notification, and network-management screens. This README documents the frontend as it is structured in this repository.

## Technology

- Next.js 16 App Router and React 19
- TypeScript with strict checking
- Tailwind CSS 4
- Zustand for shared client state
- Axios and Fetch for same-origin API calls
- Socket.IO client for live notifications
- Recharts and Lucide React for charts and icons
- Inter and JetBrains Mono through `next/font`

Use Node.js 22 and npm. The frontend has its own `package.json` and lockfile; install dependencies from this directory.

## Local development

Start the backend services and Kong gateway first. The default gateway address is `http://localhost:8000`; the backend setup is in the [project guide](../PROJECT_GUIDE.md#12-local-development-setup).

```bash
cd frontend
npm ci
npm run dev
```

Open [http://localhost:3000/login](http://localhost:3000/login). The root path redirects to `/login`. For the normal local setup, frontend environment defaults point at Kong on port `8000` and the app origin on port `3000`.

To override those defaults, create `frontend/.env.local`:

```dotenv
FOODMATRIX_API_URL=http://localhost:8000
FRONTEND_ORIGIN=http://localhost:3000
NEXT_PUBLIC_NOTIFICATION_SOCKET_URL=http://localhost:8000
```

`FOODMATRIX_API_URL` is used by Next.js server code to reach Kong. `FRONTEND_ORIGIN` is the browser origin forwarded to the services. `NEXT_PUBLIC_NOTIFICATION_SOCKET_URL` is the socket origin visible to the browser; it is optional for local development. Set `NEXT_PUBLIC_*` values before building because Next.js embeds them in the client bundle. Do not put passwords, tokens, or private service credentials in frontend environment variables.

For container networking, `localhost` refers to the current container. Use the service hostname for server-side calls (for example, `http://kong:8000` from the frontend container). The full root Compose setup and its database/Kafka prerequisites are in the [deployment and local container guide](../deploy/README.md#6-local-container-development).

## Workspaces and routes

| Area | Routes |
| --- | --- |
| Sign-in | `/login`, `/login/reset-password`, `/unauthorized` |
| Restaurant | `/restaurant/edge-dashboard`, `/restaurant/pos`, `/restaurant/waiter`, `/restaurant/kitchen`, `/restaurant/menu`, `/restaurant/inventory`, `/restaurant/punch-clock`, `/restaurant/attendancereports`, `/restaurant/staff`, `/restaurant/alerts`, `/restaurant/settings` |
| Operations | `/operations/info`, `/operations/restaurants`, `/operations/staff`, `/operations/menu`, `/operations/inventory`, `/operations/stockrequests`, `/operations/fulfillment`, `/operations/stockaudit`, `/operations/notifications`, `/operations/settings` |

Restaurant and Operations layouts provide the shared sidebar, page header, notification provider, and organization bootstrap. Sidebar navigation is defined in `src/utils/navigation.ts`; the role-specific route redirect after sign-in is handled by the server workspace helper.

## Sign-in, authorization, and workspace data

1. The login form submits to the same-origin `/api/sign-in` route handler.
2. The handler forwards the sign-in request to Better Auth through Kong and returns the session cookies to the browser.
3. The sign-in handler loads the workspace with the shared server helper, which asks Organization for the current user and assigned restaurant or franchise context. `/api/workspace` uses that same helper when a page reloads or restores the session.
4. The workspace is hydrated into the Organization Zustand store. Operations roles go to `/operations`; restaurant roles go to `/restaurant`.
5. `src/proxy.ts` redirects unauthenticated users and users entering the wrong workspace. Backend service guards still enforce authentication, roles, and resource scope for API requests; frontend route checks are not the authorization boundary.

Session cookies stay in the browser cookie jar; the frontend does not store an access token in local storage. Sign-out and password-reset requests also use same-origin route handlers.

## API and live notifications

Browser code calls same-origin Next.js routes rather than connecting directly to private backend addresses. Route handlers in `src/app/api` forward requests to Kong, preserve the session cookie, and apply the required origin and no-cache behavior.

| Frontend API prefix | Service |
| --- | --- |
| `/api/organization/*` | Organization, authentication context, restaurants, and system users |
| `/api/catalog/*` | Menu catalog, pricing metadata, modifiers, ingredients, and recipes |
| `/api/order/*` | Orders, register queue, payment, and order history |
| `/api/inventory/*` | Restaurant stock, requests, receipt, and movements |
| `/api/hr/*` | Staff, attendance, shifts, leave, wages, payroll, and payslips |
| `/api/notification/*` | Notification inbox and Socket.IO transport |
| `/api/operations/info` | Operations dashboard aggregation |

Typed domain clients live in `src/lib`. Shared client state lives in `src/store`; screen-specific loading, filters, and dialogs normally stay with the screen or feature component. `NotificationProvider` loads notifications through the API and joins the authorized restaurant or warehouse Socket.IO room for live updates.

## Code organization

```text
src/
├── app/          App Router pages, layouts, error states, and API route handlers
├── components/   Restaurant and Operations screen composition, shared shell
├── elements/     Feature-level tables, cards, forms, drawers, and dialogs
├── lib/          Typed API clients and server-side workspace helpers
├── providers/    Shared providers, including live notifications
├── store/        Zustand workspace and catalog state; browser preferences
├── utils/        Navigation, bootstrap, domain types, and formatting helpers
└── public/       Static brand and interface assets
```

Keep route files in `src/app` focused on loading and composing the page. Put reusable screen-level logic in `src/components`, and focused visual or interaction units in `src/elements`. Add API functions and response types to the relevant `src/lib` client instead of duplicating request logic in screens.

## Checks and production build

Run these from `frontend/`:

```bash
npm run lint
npx tsc --noEmit
npm run build
npm start
```

`npm start` serves the most recent production build. The frontend package currently defines lint, build, dev, and start scripts; it does not define a standalone Jest test script.

## Deployment notes

- The frontend is normally deployed with the shared image at `../deploy/images/frontend.Dockerfile`; the full stack and release flow are described in the [deployment runbook](../deploy/README.md).
- Configure `FOODMATRIX_API_URL` as an internal address reachable by the Next.js server. Configure `FRONTEND_ORIGIN` to the externally visible app origin used by the auth flow.
- Configure the notification socket URL so the browser can reach it. The deployment image uses a same-origin socket URL behind the edge proxy.
- Keep service credentials in backend/Kubernetes secrets or the hosting secret manager. Never expose them as `NEXT_PUBLIC_*` variables or commit `.env.local`.
- The frontend image build runs `npm ci` and `npm run build`; the repository CI also runs lint and TypeScript checks before release.

For backend APIs, data ownership, workflow diagrams, test reports, and service troubleshooting, see the [project guide](../PROJECT_GUIDE.md). For Terraform, Helm, Jenkins, AWS configuration, rollout, and rollback, see the [deployment runbook](../deploy/README.md).
