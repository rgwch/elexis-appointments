# elexis-appointments

To install dependencies:

```bash
cd frontend
bun install
cd ..
bun install
```

To create frontend:

```bash
cd frontend
bun install
bun run build
```

To run:

```bash
bun index.ts
```

To create standalone executable:

```bash
cd frontend
bun install
bun run build
cd ..
bun install
bun build ./index.ts --compile --outfile termine
```
