build:
	@echo "Building app..."
	@go build -o ./dist/imposter ./main.go
	@echo "Done"

test:
	@go test -v -coverprofile=coverage.out ./...

run: build
	@./dist/imposter
