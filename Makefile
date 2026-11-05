PNPM ?= pnpm

.DEFAULT_GOAL := help

.PHONY: help install dev build build-only preview type-check lint lint-oxlint lint-eslint format \
	test test-unit test-e2e test-e2e-real-api e2e-install clean check

help: ## Show available commands
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z0-9_-]+:.*?## / {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST)

install: ## Install dependencies
	$(PNPM) install

dev: ## Start the Vite dev server
	$(PNPM) dev

build: ## Type-check and build for production
	$(PNPM) build

build-only: ## Build for production without type-check
	$(PNPM) build-only

preview: ## Preview the production build
	$(PNPM) preview

type-check: ## Run vue-tsc type-check
	$(PNPM) type-check

lint: ## Run all linters (oxlint + eslint) with --fix
	$(PNPM) lint

lint-oxlint: ## Run oxlint with --fix
	$(PNPM) lint:oxlint

lint-eslint: ## Run eslint with --fix
	$(PNPM) lint:eslint

format: ## Format src/ with Prettier
	$(PNPM) format

check: type-check lint ## Run type-check and lint

test: test-unit ## Alias for test-unit

test-unit: ## Run unit tests (Vitest)
	$(PNPM) test:unit

test-e2e: ## Run e2e tests (Playwright)
	$(PNPM) test:e2e

test-e2e-real-api: ## Run e2e tests against the real API
	$(PNPM) test:e2e:real-api

e2e-install: ## Install Playwright browsers
	$(PNPM) exec playwright install

clean: ## Remove build and test artifacts
	rm -rf dist test-results .eslintcache
