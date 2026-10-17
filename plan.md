# PortfolioPro Java / Angular Remake Plan

## Product outcome

Remake the existing PortfolioPro website in the user's requested stack: **Java, Spring Boot, Angular, and MySQL**. Preserve the Night Terminal visual identity and the current finance-workspace scope: trade entry, market data, portfolio/risk management, and technical/fundamental analysis.

This remains a demo/paper-trading application unless the user later selects and authorizes an external broker and market-data provider. The existing project has no enabled broker/market-data connector. Quote, history, and fundamental figures will be labelled synthetic sample data. Order placement will never call a broker. The default paper portfolio and orders will live in this browser's local storage, not in shared server-side account rows. No sign-in or real customer brokerage data is introduced.

## Technology and serving decisions

- Java 21 and Spring Boot 4.1.1 for REST endpoints and serving the compiled Angular SPA. Spring Boot's official system-requirements page states Java 17–26 and Maven 3.6.3+ are supported; the existing environment has Java 21, so use a committed Maven Wrapper rather than relying on a preinstalled Maven executable.
- Angular 22 for the browser application. Angular's current compatibility matrix requires Node `^22.22.3` or `^24.15.0`; pin Node 22.22.3 in `.nvmrc` and in the frontend container build. Reuse the repository's pinned pnpm 10.18.0 package-manager version, add a checked-in Angular workspace package and lifecycle permission policy, and commit the generated lockfile.
- Use the existing managed MySQL database (`features.server` and `features.database` are already enabled). Read the secret `DATABASE_URL` only from the process environment; adapt its URL-form DSN to the MySQL Connector/J format in backend configuration and require TLS. Do not expose or log credentials.
- Additive, versioned Flyway migrations create only the demo market-reference tables and seed rows once. The initialized database already has a starter `users` table without Flyway history, so enable Flyway baseline-on-migrate at version `0` before running V1. Leave the pre-existing `users` schema and all existing database data untouched. MySQL stores public, illustrative instrument and fundamental reference snapshots; per-browser simulated cash, holdings, watchlists, and orders remain local and are not shared between visitors.
- Development: Angular CLI listens on `0.0.0.0:3000` (the configured Preview port) and proxies relative `/api` calls to the Spring Boot development process on `localhost:8080`. Keep browser requests origin-relative.
- Production contract: a multi-stage root `Dockerfile` builds Angular, copies the compiled browser output into Spring Boot's `classpath:/static`, packages a Java 21 executable JAR, and runs that JAR. Spring Boot binds to `0.0.0.0:${PORT:8080}` and serves both the SPA and `/api/*` on the same origin. Retain `/api/health` as the unauthenticated deployment health path. No static-host split or route-domain change is needed.
- Serving/cache behavior: keep SPA HTML revalidatable/no-store, mark API JSON `Cache-Control: no-store`, and let content-hashed assets use the deployment's static-resource cache policy. The UI includes no user-specific server-rendered HTML or shared-cache data.

## Application behavior

1. **Trading and order execution UI:** buy/sell, market/limit, whole-share validation, review/confirm, simulated market fills, open limit orders, cancellation, cash/holdings updates, and a clear paper-mode receipt. No real order API is created.
2. **Market data:** MySQL-backed sample instrument catalog/quote snapshot with search, movers, watchlist, quote details, and selectable 1D/1W/1M/3M/1Y/ALL illustrative history. All quotes and chart history are prominently identified as synthetic and not live.
3. **Portfolio and risk:** browser-local demo positions, cost basis, cash, account/market value, P&L, allocation, concentration, and sector exposure. Risk metrics remain illustrative and include a not-investment-advice disclaimer.
4. **Technical and fundamental analysis:** timeframe-aware price/volume chart with moving-average and optional band overlays, plus RSI/MACD derived from the synthetic history. MySQL-backed illustrative fundamentals show market-cap, valuation, growth, and profitability fields with a clear sample-snapshot label.
5. **Responsive workspace:** preserve the current desktop rail/mobile navigation and provide bookmarkable Overview, Portfolio, Markets, Analysis, Risk, and Orders pages at `/overview`, `/portfolio`, `/markets`, `/analysis`, `/risk`, and `/orders`; `/` redirects to `/overview`. Keep the existing brand mark, favicon, app title, and complete origin-root route manifest.

## Data/API contracts

- `GET /api/market/assets` → JSON array of assets: `symbol`, `name`, `price`, `change`, `changePct`, `sector`, `exchange`, `color`, and `description`.
- `GET /api/market/assets/{symbol}/history?range=...` → `{symbol, range, points[]}` with ISO timestamp/label, close value, average, upper/lower band values, sample volume, RSI, and MACD. Validate symbol and range; generate deterministic demo history from the seeded sample quote, not from an external service.
- `GET /api/market/assets/{symbol}/fundamentals` → a typed, illustrative fundamentals snapshot from MySQL.
- `GET /api/health` → concise readiness status, including the MySQL connection.
- No REST endpoint accepts or submits a brokerage order. The Angular paper-trading service validates and updates local browser state only.

The Angular `MarketApiService` and DTO types must match the Java JSON serialization exactly. Use real HTTP responses from the running Spring API to verify the fields consumed by the Angular parsing/service code.

## Project structure

- `frontend/`: Angular CLI workspace, `src/app/core/api` for typed HTTP services and DTO parsing; `src/app/shared` for reusable icons, charts and financial formatting; `src/app/features/{overview,markets,portfolio,analysis,risk,orders}` for independently understandable screens; `public/` for `manus-routes.json` and existing brand assets; Angular styles and responsive design tokens.
- `backend/`: Maven/Spring Boot application. `api/` contains REST controllers and response DTOs; `market/` contains market-reference JDBC repository and analysis/history service; `config/` contains `DATABASE_URL` handling and HTTP/cache configuration; `src/main/resources/db/migration/` contains additive Flyway SQL; tests cover range validation, sample-history calculations, order-independent server boundaries, and response contracts.
- Root `Dockerfile`: frontend build stage, Spring Boot package stage, minimal Java runtime stage.
- Root `README.md`, `.nvmrc`, Maven wrapper files, and `plan.md`: developer entry points, pinned build tooling, and architecture record.
- `app.config.ts` and the existing PortfolioPro PNG/SVG mark remain project-level metadata/branding; `/manus-routes.json` stays at the web origin root.

## Verification

Use repository-installed checks: Angular production build/type checking; Maven tests and package build; additive Flyway migration against the configured managed MySQL; real HTTP checks for `/`, `/manus-routes.json`, `/api/health`, assets, quote/history/fundamental APIs; and a JSON/data-shape check through the frontend's typed API service. Verify both the configured local listener and canonical Preview origin. Do not place an order with a broker, connect an unapproved provider, or publish the site as part of this remake.

## Version references

- Spring Boot system requirements (4.1.1; Java 17–26; Maven 3.6.3+): https://docs.spring.io/spring-boot/system-requirements.html
- Angular version compatibility (Angular 22; Node `^22.22.3` or `^24.15.0`): https://angular.dev/reference/versions
