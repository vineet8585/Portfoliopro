# PortfolioPro: Stock Trading & Portfolio Management

Java 21 / Spring Boot / MySQL API with an Angular 22 client. The Night Terminal workspace is a paper-trading demonstration: seeded prices, history and fundamentals are illustrative, and orders never reach a brokerage.

- `nvm use` (Node 22.22.3), then `pnpm dev`: run Angular on the configured Preview port 3000 and Spring Boot on port 8081.
- `pnpm dev:web` or `pnpm dev:api`: run one development process independently (override the API port with `API_PORT`).
- For local MySQL-backed development on Windows, run `powershell -ExecutionPolicy Bypass -File .\scripts\start-mysql-api.ps1`; enter the `portfolio_user` password at the hidden prompt. The script does not save the password.
- `pnpm build`: build the Angular client and package the executable Spring Boot JAR.
- `pnpm check` / `pnpm test`: run the Angular production/type build and Spring Boot tests (plus Angular tests for `test`).
- Spring Boot applies the versioned Flyway migrations at startup. The local `pnpm dev` launcher uses a persistent H2 database under `backend/data` when no database URL is configured. Non-local runs require `DATABASE_URL` (or `DRIZZLE_DATABASE_URL`) for MySQL.
- With the `local` profile, TLS is disabled only for MySQL loopback hosts to support legacy local MySQL servers; remote MySQL connections and non-local profiles continue to require TLS.
- Configure `DATABASE_URL` only through the managed server environment. Never place database credentials in Angular code, source files, or logs.

`GET /api/market/assets`, `/api/market/assets/{symbol}/history?range=...`, and `/api/market/assets/{symbol}/fundamentals` serve sample MySQL data; `/api/health` reports readiness. Angular requests use relative `/api` URLs, proxied to Spring Boot during development.

The simulated paper account, positions, watchlist and order log are saved in this browser's local storage. This is not a real brokerage, live market feed, financial advice, or a production investment account.

The root Dockerfile builds Angular, includes its browser files in Spring Boot's static resources, and runs the Java 21 executable JAR on the platform-provided port. `railway.json` configures Railway to use that Dockerfile and check `/api/health`.

## Railway deployment

1. Push this repository to GitHub and create a Railway project from that repository.
2. Add a Railway MySQL service to the project.
3. On the app service, set `DATABASE_URL` to the Railway reference `${{ MySQL.MYSQL_URL }}`, replacing `MySQL` with the actual database service name. Never paste database credentials into source files.
4. Deploy the app service and use its generated public domain. Flyway creates the tables during startup; `/api/health` should return `{"status":"ready","database":"connected"}`.

Use a separate production database and a strong unique app-user password. The local `local` profile is not enabled by Railway; remote database connections require TLS.
