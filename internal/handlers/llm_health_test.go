package handlers

import "testing"

func TestValidateCLIExecArgs_AllowsReadonlyCommands(t *testing.T) {
	tests := [][]string{
		{"--version"},
		{"models", "status", "--probe", "--json", "--timeout", "5000"},
		{"channels", "status", "--probe", "--json"},
		{"logs", "--limit", "50", "--json"},
	}

	for _, args := range tests {
		if err := validateCLIExecArgs(args); err != nil {
			t.Fatalf("expected args %v to be allowed, got %v", args, err)
		}
	}
}

func TestValidateCLIExecArgs_RejectsDangerousShapes(t *testing.T) {
	tests := [][]string{
		{"config", "set", "x", "y"},
		{"models", "status", "--timeout", "500000"},
		{"logs", "--limit", "9999", "--json"},
		{"doctor", "--non-interactive", "--fix"},
	}

	for _, args := range tests {
		if err := validateCLIExecArgs(args); err == nil {
			t.Fatalf("expected args %v to be rejected", args)
		}
	}
}
