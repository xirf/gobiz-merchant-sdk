# Contributing to @xirf/gobiz-merchant-sdk

This document describes how to build, test, and contribute changes to this repository.

## Development Requirements

- [Bun](https://bun.sh) (v1.1.0 or newer) or Node.js (v18.0.0 or newer)
- Git

## Getting Started

1. Clone the repository:
   ```bash
   git clone https://github.com/xirf/gobiz-merchant-sdk.git
   cd gobiz-merchant-sdk
   ```

2. Install dependencies:
   ```bash
   bun install
   ```

3. Build the TypeScript package:
   ```bash
   bun run build
   ```

## Running Tests

All unit tests are written with Bun / Vitest compatible syntax and can be executed via:

```bash
bun test
```

To run a specific test file:
```bash
bun test tests/portal.test.ts
```

## Making Changes

1. Create a descriptive feature branch:
   ```bash
   git checkout -b fix/poller-jitter-interval
   ```
2. Write unit tests for your changes under the `tests/` directory.
3. Ensure all tests pass and code compiles:
   ```bash
   bun test
   bun run build
   ```
4. Commit your changes following conventional commit messages:
   ```bash
   git commit -m "fix(portal): handle 401 token refresh on settlement check"
   ```
5. Push to your fork and submit a Pull Request.

## Pull Request Guidelines

- Keep PRs focused on a single bug fix or feature.
- Include unit tests verifying new functionality or bug reproductions.
- Do not check in sensitive test credentials, live tokens, or production API keys.
- Follow existing formatting and naming conventions.
