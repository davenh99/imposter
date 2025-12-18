build:
	@echo "Building app..."
	@echo "Building UI..."
	@cd ui && npm run build || echo "ui build skipped (npm not available)"
	@if [ -d ui/dist ]; then \
		rm -rf api/staticdist || true; \
		cp -r ui/dist api/staticdist; \
	else \
		echo "ERROR: ui/dist not found. Run 'cd ui && npm run build' first."; exit 1; \
	fi
	@echo "Building Go binary..."
	@go build -o ./dist/imposter ./main.go
	@echo "Done"

test:
	@go test -v -coverprofile=coverage.out ./...

run: build
	@./dist/imposter

.PHONY: dev
dev:
	@echo "Starting backend and frontend (dev mode). Press Ctrl-C to stop."
	@echo "Backend logs will appear below (check lobbies.log for persistent logs)"
	@echo "Frontend: http://localhost:3000"
	@bash -c 'set -e; trap "kill 0" INT TERM EXIT; (cd ui && npm run dev > /tmp/vite.log 2>&1) & (go run ./main.go) & wait'

.PHONY: dev-ui
dev-ui:
	@cd ui && npm run dev

.PHONY: dev-backend
dev-backend:
	@go run ./main.go

.PHONY: tail-logs
tail-logs:
	@tail -f lobbies.log
