//go:build !windows

package openclaw

import (
	"fmt"
	"os"
	"syscall"
)

var sysProcAttrDetached = syscall.SysProcAttr{}

func launchdGuiDomain() string {
	return fmt.Sprintf("gui/%d", os.Getuid())
}
