FROM golang:1.25-alpine AS builder

WORKDIR /app
ENV GOFLAGS=-mod=mod

COPY backend/go.mod backend/go.sum* ./
RUN go mod download

COPY backend/ ./
RUN CGO_ENABLED=0 GOOS=linux go build -o /erp-api ./cmd/api

FROM alpine:3.21

WORKDIR /app
ENV GOFLAGS=-mod=mod

COPY --from=builder /erp-api /usr/local/bin/erp-api

EXPOSE 8000

CMD ["erp-api"]
