# Internal Operations Service Hub
## Overview
The Internal Operations Service Hub is a company-internal system for requesting and tracking help from departments such as IT, HR, and Finance.
The product aims to provide employees with one central place to submit and follow internal service requests, while helping internal department staff handle requests with clear status, ownership, and approval progress.

## Problem
Internal requests are often communicated through unstructured channels, which can cause requests to be forgotten, sent to the wrong person, or become unclear in terms of ownership, status, and approval.
This project defines the product foundation for a more structured internal request-handling system.

## Documentation
The repository contains the following product foundation documents:
- [`product-spec.md`](docs/product-spec.md) — Defines the problem, actors, requirements, constraints, non-goals, and acceptance criteria.
- [`architecture.md`](docs/architecture.md) — Describes the high-level system structure, responsibilities, data flows, trust boundaries, resilience considerations, and architecture decisions.
- [`data-model.md`](docs/data-model.md) — Describes the domain entities, relationships, lifecycle rules, storage reasoning, and important access patterns.
- [`ADR-001.md`](docs/decisions/ADR-001.md) — Records an important architecture decision and its consequences.

## Repository Structure
```text
.
├── README.md
└── docs/
    ├── product-spec.md
    ├── architecture.md
    ├── data-model.md
    └── decisions/
        └── ADR-001.md