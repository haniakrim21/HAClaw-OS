package database

import (
	"strings"

	"HAClaw/internal/secretutil"
	"HAClaw/internal/webconfig"
)

func encryptStoredValue(value string) (string, error) {
	return secretutil.EncryptString(value, currentSecretKey())
}

func decryptStoredValue(value string) (string, error) {
	return secretutil.DecryptString(value, currentSecretKey())
}

func currentSecretKey() string {
	cfg, err := webconfig.Load()
	if err != nil {
		return ""
	}
	return strings.TrimSpace(cfg.Auth.JWTSecret)
}
