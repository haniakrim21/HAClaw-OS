package main

import (
	"os"

	"HAClaw/internal/cli"
)

func main() {
	os.Exit(cli.Run(os.Args))
}
