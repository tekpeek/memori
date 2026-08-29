FROM ubuntu:latest AS build

WORKDIR /memori

COPY . /memori

USER root

RUN apt-get update && apt-get install -y \
    golang ca-certificates

RUN go build -o memori .

FROM scratch
WORKDIR /memori
COPY --from=build /memori .
EXPOSE 8080
ENTRYPOINT ["./memori"]