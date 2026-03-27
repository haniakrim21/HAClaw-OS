package handlers

import (
	"net/http"
	"os"
	"strings"

	"HAClaw-OS/internal/constants"
	"HAClaw-OS/internal/database"
	"HAClaw-OS/internal/logger"
	"HAClaw-OS/internal/openclaw"
	"HAClaw-OS/internal/service"
	"HAClaw-OS/internal/web"
	"HAClaw-OS/internal/webconfig"
)

type ServiceHandler struct {
	auditRepo *database.AuditLogRepo
}

func NewServiceHandler(auditRepo *database.AuditLogRepo) *ServiceHandler {
	return &ServiceHandler{auditRepo: auditRepo}
}

func (h *ServiceHandler) writeAudit(r *http.Request, action, result, detail string) {
	h.auditRepo.Create(&database.AuditLog{
		UserID:   web.GetUserID(r),
		Username: web.GetUsername(r),
		Action:   action,
		Result:   result,
		Detail:   detail,
		IP:       r.RemoteAddr,
	})
}

type serviceStatusResponse struct {
	OpenClawInstalled  bool `json:"openclaw_installed"`
	HAClawOSInstalled bool `json:"haclawx_installed"`
	IsDocker           bool `json:"is_docker"`
}

func (h *ServiceHandler) Status(w http.ResponseWriter, r *http.Request) {
	svc := openclaw.NewService()
	status := svc.DaemonStatus()
	isDocker := isDockerEnvironment()

	web.OK(w, r, serviceStatusResponse{
		OpenClawInstalled:  status.Installed,
		HAClawOSInstalled:  service.IsInstalled(),
		IsDocker:           isDocker,
	})
}

func isDockerEnvironment() bool {
	if _, err := os.Stat("/.dockerenv"); err == nil {
		return true
	}
	data, err := os.ReadFile("/proc/1/cgroup")
	if err == nil {
		s := string(data)
		if strings.Contains(s, "docker") || strings.Contains(s, "containerd") {
			return true
		}
	}
	return false
}

func (h *ServiceHandler) InstallOpenClaw(w http.ResponseWriter, r *http.Request) {
	svc := openclaw.NewService()
	if err := svc.DaemonInstall(); err != nil {
		web.Fail(w, r, "INSTALL_FAILED", err.Error(), http.StatusInternalServerError)
		return
	}
	web.OK(w, r, map[string]string{"message": "OpenClaw service installed"})
}

func (h *ServiceHandler) UninstallOpenClaw(w http.ResponseWriter, r *http.Request) {
	svc := openclaw.NewService()
	if err := svc.DaemonUninstall(); err != nil {
		web.Fail(w, r, "UNINSTALL_FAILED", err.Error(), http.StatusInternalServerError)
		return
	}
	web.OK(w, r, map[string]string{"message": "OpenClaw service uninstalled"})
}

func (h *ServiceHandler) InstallHAClawOS(w http.ResponseWriter, r *http.Request) {
	logger.Log.Info().
		Str("user", web.GetUsername(r)).
		Str("ip", r.RemoteAddr).
		Msg("user requested HAClaw-OS service install")

	// Read current port from config
	cfg, err := webconfig.Load()
	if err != nil {
		cfg = webconfig.Default()
	}

	if err := service.Install(cfg.Server.Port); err != nil {
		h.writeAudit(r, constants.ActionServiceInstall, "failed", "HAClaw-OS install: "+err.Error())
		logger.Log.Error().Err(err).Msg("HAClaw-OS service install failed")
		web.Fail(w, r, "INSTALL_FAILED", err.Error(), http.StatusInternalServerError)
		return
	}

	h.writeAudit(r, constants.ActionServiceInstall, "success", "HAClaw-OS service installed")
	logger.Log.Info().Msg("HAClaw-OS service installed")
	web.OK(w, r, map[string]bool{"installed": service.IsInstalled()})
}

func (h *ServiceHandler) UninstallHAClawOS(w http.ResponseWriter, r *http.Request) {
	logger.Log.Info().
		Str("user", web.GetUsername(r)).
		Str("ip", r.RemoteAddr).
		Msg("user requested HAClaw-OS service uninstall")

	if err := service.Uninstall(); err != nil {
		h.writeAudit(r, constants.ActionServiceUninstall, "failed", "HAClaw-OS uninstall: "+err.Error())
		logger.Log.Error().Err(err).Msg("HAClaw-OS service uninstall failed")
		web.Fail(w, r, "UNINSTALL_FAILED", err.Error(), http.StatusInternalServerError)
		return
	}

	h.writeAudit(r, constants.ActionServiceUninstall, "success", "HAClaw-OS service uninstalled")
	logger.Log.Info().Msg("HAClaw-OS service uninstalled")
	web.OK(w, r, map[string]bool{"installed": service.IsInstalled()})
}
