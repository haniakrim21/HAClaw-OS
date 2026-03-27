package main

import (
	"os"

	"HAClaw-OS/internal/cli"
)

func main() {
	os.Exit(cli.Run(os.Args))
}
