# Local validation

No commands were run for this change. Run these checks locally:

```powershell
cd api
uv run alembic upgrade head
uv run ruff check src alembic
cd ..\web
pnpm build
```

Auth flow:

1. Login sets `HttpOnly` access and refresh cookies.
2. Reload keeps session through `POST /api/v1/auth/refresh`.
3. Expired access cookie refreshes once, then retries request.
4. Logout revokes refresh session and clears both cookies.
5. Reusing rotated refresh cookie returns `401` and revokes active sessions.
6. Cross-origin mutating requests return `403`.

UI validation:

```powershell
cd web
pnpm build
```

The TanStack Start plugin regenerates `src/routeTree.gen.ts` from the `_auth`
and `_app` route files during the build.