# Copilot Instructions for Dipali Shoe House

## Build, test, and lint commands

Use the repository scripts from the project root:

- Install dependencies: `npm install`
- Start the app in development mode: `npm run dev`
- Create a production build: `npm run build`
- Validate the code with ESLint: `npm run lint`
- Preview the production build locally: `npm run preview`

There is no dedicated test runner or `test` script configured in this repository, so there is no single-test command to document. The current validation path is `npm run build` plus `npm run lint`. Workspace browser automation is configured through the Playwright MCP server in `.vscode/mcp.json`.

## High-level architecture

This is a Vite + React POS application intended to be configurable for different retail businesses. It is front-end only and stores its state in browser `localStorage`; there is no backend API.

- `src/App.tsx` is the app root. It composes the global providers and decides which screen to render based on the logged-in user and role.
- `src/contexts/AuthContext.jsx` handles authentication and user sessions (`pos_user` / `pos_users` keys). It exposes `useAuth` and sets `user` + `loading` for the app shell.
- `src/contexts/InventoryContext.jsx` is the product store. It manages products, stock, configured categories, internal stock-unit tracking, and registration of existing QR payloads. It persists inventory to `localStorage` under `pos_products`.
- `src/contexts/SettingsContext.jsx` stores business details, business type, categories, custom product-field definitions, and printer settings; it bootstraps default admin/cashier users and persists configuration to `pos_shop_settings` and `pos_printer_settings`.
- `src/components/Layout.jsx` renders the role-aware sidebar and header shell for the app.
- `src/components/POS.jsx` is the largest and most feature-dense screen. It contains the retail workflow: product search, cart management, direct bill entry, returns, dues, daily drawer totals, scanners, discount logic, and expense tracking. It persists sales, due records, drawer data, and tender totals in `localStorage`.
- `src/components/QrManager.jsx` is an admin-only general-purpose QR batch generator. It stores unique numeric QR payloads and batch history separately in `localStorage`, and prints configurable thermal labels without changing inventory.
- `src/components/Inventory.jsx`, `Reports.jsx`, `Users.jsx`, and `Settings.jsx` are the remaining admin screens.

The repository mixes JSX/JavaScript and TSX/TypeScript files, but the architecture is still a single-page React app without a backend or API client.

## Key conventions

- Prefer existing providers and hooks (`useAuth`, `useInventory`, `useSettings`) over creating new state patterns or parallel storage logic.
- Respect the repository's localStorage-first design. When changing or adding functionality, check the relevant `pos_*` storage keys and the provider that owns them before writing new logic.
- Business categories and custom product fields are configured through Settings and live in `pos_shop_settings`; keep product add/edit, CSV import/export, search, and POS displays aligned with that schema.
- Existing products may have legacy top-level `brand` and `size` values. Preserve and display those when configured fields use the matching keys, and retain unrelated product properties when editing.
- Role-based behavior is important: admin-only screens are gated in `src/App.tsx` and the menu in `src/components/Layout.jsx`. Keep admin-only features behind `user.role === 'admin'`.
- The POS workflow is state-heavy and modal-driven; edits there should be incremental and keep the existing local state patterns intact so sales, drawer, dues, and returns remain compatible.
- Inventory logic reconciles stock against internal units. Existing product QR codes can be registered and scanned without changing their payloads. The separate admin QR Generator creates general-purpose, numbered QR batches in local storage and prints them independently of inventory.
- Tailwind utility classes are the default styling approach. Follow the existing component patterns and utility classes instead of introducing ad hoc CSS files unless the feature requires a truly custom style.
- Do not add demo/sample products to default inventory. Existing users and seeded admin/cashier accounts are created in `SettingsContext.jsx` when no stored users exist.
