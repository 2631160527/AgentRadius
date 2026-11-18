# Agent Radius

Agent Radius is an open-source, local-first consequence analysis tool for autonomous agent actions. It answers: **before an agent acts, what code, data, services, agents, APIs, and external systems can be affected?**

## MVP status

The MVP reads TypeScript/JavaScript source, Git changes, SQL schema, agent metadata, and external-system metadata. It builds an evidence-preserving graph and reports a transparent impact heuristic. It does not require an LLM or paid API.

The score is a prioritization signal, not a probability or a security guarantee. Results depend on the source patterns and metadata available to the scanner.

## Install and run

```bash
pnpm install
pnpm build
node dist/apps/cli/src/main.js --help
```

In a repository:

```bash
node dist/apps/cli/src/main.js init
node dist/apps/cli/src/main.js analyze
node dist/apps/cli/src/main.js analyze --json
node dist/apps/cli/src/main.js explain src/payment/payment.ts
node dist/apps/cli/src/main.js graph
node dist/apps/cli/src/main.js check --action action.json --json
```

`init` creates `.agent-radius/config.yaml` and `.agent-radius/agents.yaml`. Agent touch patterns use paths such as `src/payment/**` and tables such as `db:payments`.

## Real demo

```bash
cd examples/demo-project
node ../../dist/apps/cli/src/main.js analyze
node ../../dist/apps/cli/src/main.js explain src/order/order.ts
```

The demo connects order code to payment/shipping functions, database tables, billing/shipping agents, and the Stripe API. Every reported relationship includes evidence such as `ast`, `schema`, `metadata`, or `config`.

## Development

```bash
pnpm test
pnpm build
```

The benchmark format described in `docs/prior-art.md` is intentionally kept separate from the MVP scanner. Add cases with an initial repository, an action, expected impacted entities, actual output, precision, recall, path accuracy, and explanation coverage.

## Copyright and reuse

Copyright (c) 2026 蔡宇翔. The project is distributed under Apache-2.0; see `LICENSE` and `NOTICE`. Keep the copyright and license notices in copies and substantial portions. GitHub publication does not prevent copying by itself, so use branch protection, secret scanning, Dependabot, signed releases, and clear provenance when publishing.
