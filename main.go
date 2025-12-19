package main

import (
	"log"
	"os"

	"imposter/api"
)

func main() {
	addr := "127.0.0.1:8080"
	if a := os.Getenv("IMPOSTER_ADDR"); a != "" {
		addr = a
	}

	s := api.NewAPIServer(addr)
	if err := s.Run(); err != nil {
		log.Fatal(err)
	}
}
