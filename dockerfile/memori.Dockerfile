FROM ubuntu:latest AS build

WORKDIR /memori

COPY . .

RUN apt-get update && apt-get install -y \
    golang ca-certificates

RUN CGO_ENABLED=0 go build -o memori .

FROM scratch
WORKDIR /memori

COPY --from=build /memori/memori .
COPY --from=build /memori/public ./public
COPY --from=build /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/

EXPOSE 8080
ENTRYPOINT ["./memori"]