import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Language } from '../types';
import { getTranslation } from '../locales';
import { authApi, auditApi, notifyApi, serverConfigApi, gatewayApi } from '../services/api';
import type { ServerConfig } from '../services/api';
import { useToast } from '../components/Toast';
import { useConfirm } from '../components/ConfirmDialog';
import CustomSelect from '../components/CustomSelect';
import { SmartLink } from '../components/SmartLink';
import NotifyChannelCard from '../components/NotifyChannelCard';
import type { NotifyChannelDef } from '../components/NotifyChannelCard';
import SnapshotTab from './Settings/SnapshotTab';
import UpdateTab from './Settings/UpdateTab';
import PreferencesTab from './Settings/PreferencesTab';
import type { Preferences } from '../utils/preferences';
import { loadPreferences } from '../utils/preferences';

type SettingsTab = 'account' | 'notify' | 'snapshot' | 'preferences' | 'audit' | 'update';

interface SettingsProps {
  language: Language;
  onLogout?: () => void | Promise<void>;
  pendingTab?: string | null;
  onTabConsumed?: () => void;
  onPrefsChange?: (prefs: Preferences) => void;
}

const Settings: React.FC<SettingsProps> = ({ language, onLogout, pendingTab, onTabConsumed, onPrefsChange }) => {
  const t = useMemo(() => getTranslation(language), [language]);
  const s = t.set;
  const { toast } = useToast();
  const { confirm } = useConfirm();
  const [activeTab, setActiveTab] = useState<SettingsTab>('account');
  const [drawerOpen, setDrawerOpen] = useState(false);

  // 支持从外部跳转时预设 tab（如仪表盘的"备份"快捷操作）
  const [prefs, setPrefs] = useState<Preferences>(loadPreferences);

  const handlePrefsChange = useCallback((next: Preferences) => {
    setPrefs(next);
    onPrefsChange?.(next);
  }, [onPrefsChange]);

  const VALID_TABS: SettingsTab[] = useMemo(() => ['account', 'notify', 'snapshot', 'preferences', 'audit', 'update'], []);
  useEffect(() => {
    if (pendingTab && VALID_TABS.includes(pendingTab as SettingsTab)) {
      setActiveTab(pendingTab as SettingsTab);
      onTabConsumed?.();
    }
  }, [pendingTab, onTabConsumed, VALID_TABS]);
  useEffect(() => {
    const handler = (evt: Event) => {
      const ce = evt as CustomEvent<{ id?: string; tab?: string }>;
      if (ce?.detail?.id !== 'settings') return;
      const tab = ce?.detail?.tab;
      if (tab && VALID_TABS.includes(tab as SettingsTab)) {
        setActiveTab(tab as SettingsTab);
      }
    };
    window.addEventListener('haclaw:open-window', handler as EventListener);
    return () => window.removeEventListener('haclaw:open-window', handler as EventListener);
  }, [VALID_TABS]);

  const handleTabSelect = (tab: SettingsTab) => {
    setActiveTab(tab);
    setDrawerOpen(false);
  };

  // ── 当前用户 ──
  const [currentUser, setCurrentUser] = useState<{ username: string; role: string } | null>(null);

  // ── 账户安全 ──
  const [newUsername, setNewUsername] = useState('');
  const [usernameVerifyPwd, setUsernameVerifyPwd] = useState('');
  const [usernameLoading, setUsernameLoading] = useState(false);
  const [usernameError, setUsernameError] = useState('');
  const [oldPwd, setOldPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdError, setPwdError] = useState('');

  // ── 审计日志 ──
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [auditPage, setAuditPage] = useState(1);
  const [auditTotal, setAuditTotal] = useState(0);
  const [auditLoading, setAuditLoading] = useState(false);

  // ── 通知配置 ──
  const [notifyCfg, setNotifyCfg] = useState<Record<string, string>>({});
  const [notifyActive, setNotifyActive] = useState<string[]>([]);
  const [notifyAvailable, setNotifyAvailable] = useState<any[]>([]);
  const [notifyDirty, setNotifyDirty] = useState(false);
  const [notifySaving, setNotifySaving] = useState(false);
  const [notifyTesting, setNotifyTesting] = useState(false);
  const [notifyShutdown, setNotifyShutdown] = useState(false);

  // ── 访问安全 ──
  const [srvCfg, setSrvCfg] = useState<ServerConfig>({ bind: '0.0.0.0', port: 18788, cors_origins: [], clawhub_query_url: 'https://wry-manatee-359.convex.cloud/api/query', skillhub_data_url: 'https://cloudcache.tencentcs.com/qcloud/tea/app/data/skills.33d56946.json' });
  const [srvCfgOriginal, setSrvCfgOriginal] = useState<ServerConfig>({ bind: '0.0.0.0', port: 18788, cors_origins: [], clawhub_query_url: 'https://wry-manatee-359.convex.cloud/api/query', skillhub_data_url: 'https://cloudcache.tencentcs.com/qcloud/tea/app/data/skills.33d56946.json' });
  const [srvCfgSaving, setSrvCfgSaving] = useState(false);
  const [srvCfgDirty, setSrvCfgDirty] = useState(false);
  const [srvCfgRestart, setSrvCfgRestart] = useState(false);
  const [bindMode, setBindMode] = useState<'all' | 'local' | 'custom'>('all');
  const [newCorsOrigin, setNewCorsOrigin] = useState('');

  const navItems: { id: SettingsTab; icon: string; label: string; color: string }[] = [
    { id: 'account', icon: 'shield_person', label: s.account, color: 'bg-blue-500' },
    { id: 'notify', icon: 'notifications_active', label: s.notify, color: 'bg-amber-500' },
    { id: 'snapshot', icon: 'backup', label: s.snapshotTitle || s.backup, color: 'bg-emerald-500' },
    { id: 'preferences', icon: 'tune', label: (t as any).pref?.title || 'Preferences', color: 'bg-violet-500' },
    { id: 'audit', icon: 'assignment', label: s.auditLog, color: 'bg-orange-500' },
    { id: 'update', icon: 'system_update', label: s.system || 'Software Update', color: 'bg-cyan-500' },
  ];

  const notifyChannelDefs: NotifyChannelDef[] = useMemo(() => [
    {
      id: 'telegram', icon: 'send', iconColor: 'text-[#229ED9]', title: s.notifyTelegram,
      fields: [
        { key: 'notify_telegram_token', label: s.notifyTgToken, hint: s.notifyTgTokenHint, placeholder: '123456:ABC-DEF...', type: 'password' },
        { key: 'notify_telegram_chat_id', label: s.notifyTgChatId, hint: s.notifyTgChatIdHint, placeholder: '-1001234567890' },
      ],
    },
    {
      id: 'dingtalk', icon: 'notifications', iconColor: 'text-orange-500', title: s.notifyDingtalk,
      fields: [
        { key: 'notify_dingtalk_token', label: s.notifyDdToken, hint: s.notifyDdTokenHint, placeholder: 'access_token...', type: 'password' },
        { key: 'notify_dingtalk_secret', label: s.notifyDdSecret, hint: s.notifyDdSecretHint, placeholder: 'SEC...', type: 'password' },
      ],
    },
    {
      id: 'lark', icon: 'apartment', iconColor: 'text-blue-500', title: s.notifyLark,
      fields: [
        { key: 'notify_lark_webhook_url', label: s.notifyLarkUrl, hint: s.notifyLarkUrlHint, placeholder: 'https://open.feishu.cn/open-apis/bot/v2/hook/...' },
      ],
    },
    {
      id: 'discord', icon: 'sports_esports', iconColor: 'text-indigo-500', title: s.notifyDiscord,
      fields: [
        { key: 'notify_discord_token', label: s.notifyDcToken, hint: s.notifyDcTokenHint, placeholder: 'Bot token...', type: 'password' },
        { key: 'notify_discord_channel_id', label: s.notifyDcChannelId, hint: s.notifyDcChannelIdHint, placeholder: '123456789012345678' },
      ],
    },
    {
      id: 'slack', icon: 'tag', iconColor: 'text-green-600', title: s.notifySlack,
      fields: [
        { key: 'notify_slack_token', label: s.notifySlackToken, hint: s.notifySlackTokenHint, placeholder: 'xoxb-...', type: 'password' },
        { key: 'notify_slack_channel_id', label: s.notifySlackChannelId, hint: s.notifySlackChannelIdHint, placeholder: 'C01234ABCDE' },
      ],
    },
    {
      id: 'wecom', icon: 'business', iconColor: 'text-emerald-500', title: s.notifyWecom,
      fields: [
        { key: 'notify_wecom_webhook_url', label: s.notifyWecomUrl, hint: s.notifyWecomUrlHint, placeholder: 'https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=...' },
      ],
    },
    {
      id: 'webhook', icon: 'webhook', iconColor: 'text-pink-500', title: s.notifyWebhook,
      fields: [
        { key: 'notify_webhook_url', label: s.notifyWebhookUrl, placeholder: 'https://hooks.example.com/...' },
        { key: 'notify_webhook_method', label: s.notifyWebhookMethod, type: 'select', options: [{ value: 'POST', label: 'POST' }, { value: 'GET', label: 'GET' }, { value: 'PUT', label: 'PUT' }], half: true },
        { key: 'notify_webhook_headers', label: s.notifyWebhookHeaders, hint: s.notifyWebhookHeadersHint, placeholder: 'Authorization:Bearer xxx', half: true },
        { key: 'notify_webhook_template', label: s.notifyWebhookTemplate, hint: s.notifyWebhookTemplateHint, placeholder: '{"text": "{message}"}', type: 'textarea' },
      ],
    },
  ], [s]);

  const fetchAuditLogs = useCallback((page: number) => {
    setAuditLoading(true);
    auditApi.list({ page, page_size: 15 }).then((data: any) => {
      if (page === 1) setAuditLogs(data.list || []);
      else setAuditLogs(prev => [...prev, ...(data.list || [])]);
      setAuditTotal(data.total || 0);
      setAuditPage(page);
    }).catch(() => { }).finally(() => setAuditLoading(false));
  }, []);

  const fetchNotifyConfig = useCallback((force = false) => {
    notifyApi.getConfigCached(15000, force).then((data) => {
      setNotifyCfg(data?.config || {});
      setNotifyActive(data?.active_channels || []);
      setNotifyAvailable(data?.available_channels || []);
      setNotifyDirty(false);
    }).catch(() => { });
    gatewayApi.lifecycleNotifyConfig().then((data: any) => {
      if (data?.notify_shutdown !== undefined) setNotifyShutdown(data.notify_shutdown);
    }).catch(() => { });
  }, []);

  const handleNotifySave = useCallback(async () => {
    setNotifySaving(true);
    try {
      const res = await notifyApi.updateConfig(notifyCfg);
      setNotifyActive(res?.active_channels || []);
      setNotifyDirty(false);
      toast('success', s.notifySaved);
    } catch { toast('error', s.notifySaveFail); }
    setNotifySaving(false);
  }, [notifyCfg, s, toast]);

  const handleNotifyTest = useCallback(async () => {
    setNotifyTesting(true);
    try {
      await notifyApi.testSend();
      toast('success', s.notifyTestOk);
    } catch { toast('error', s.notifyTestFail); }
    setNotifyTesting(false);
  }, [s, toast]);

  const setNf = useCallback((key: string, value: string) => {
    setNotifyCfg(prev => ({ ...prev, [key]: value }));
    setNotifyDirty(true);
  }, []);

  // ── 访问安全 handlers ──
  const fetchServerConfig = useCallback(() => {
    serverConfigApi.get().then((data) => {
      const cfg: ServerConfig = {
        bind: data.bind || '0.0.0.0',
        port: data.port || 18788,
        cors_origins: data.cors_origins || [],
        clawhub_query_url: data.clawhub_query_url || 'https://wry-manatee-359.convex.cloud/api/query',
        skillhub_data_url: data.skillhub_data_url || 'https://cloudcache.tencentcs.com/qcloud/tea/app/data/skills.33d56946.json',
      };
      setSrvCfg(cfg);
      setSrvCfgOriginal(cfg);
      setSrvCfgDirty(false);
      setSrvCfgRestart(false);
      if (cfg.bind === '0.0.0.0') setBindMode('all');
      else if (cfg.bind === '127.0.0.1') setBindMode('local');
      else setBindMode('custom');
    }).catch(() => { });
  }, []);

  const handleSrvCfgSave = useCallback(async () => {
    setSrvCfgSaving(true);
    try {
      await serverConfigApi.update(srvCfg);
      setSrvCfgOriginal(srvCfg);
      setSrvCfgDirty(false);
      setSrvCfgRestart(true);
      toast('success', s.accessSaved);
    } catch { toast('error', s.accessSaveFail); }
    setSrvCfgSaving(false);
  }, [srvCfg, s, toast]);

  const updateSrvCfg = useCallback((patch: Partial<ServerConfig>) => {
    setSrvCfg(prev => {
      const next = { ...prev, ...patch };
      setSrvCfgDirty(JSON.stringify(next) !== JSON.stringify(srvCfgOriginal));
      return next;
    });
  }, [srvCfgOriginal]);

  const handleBindModeChange = useCallback((mode: 'all' | 'local' | 'custom') => {
    setBindMode(mode);
    if (mode === 'all') updateSrvCfg({ bind: '0.0.0.0' });
    else if (mode === 'local') updateSrvCfg({ bind: '127.0.0.1' });
  }, [updateSrvCfg]);

  const handleAddCorsOrigin = useCallback(() => {
    const origin = newCorsOrigin.trim();
    if (!origin) return;
    if (srvCfg.cors_origins.includes(origin)) return;
    updateSrvCfg({ cors_origins: [...srvCfg.cors_origins, origin] });
    setNewCorsOrigin('');
  }, [newCorsOrigin, srvCfg.cors_origins, updateSrvCfg]);

  const handleRemoveCorsOrigin = useCallback((idx: number) => {
    updateSrvCfg({ cors_origins: srvCfg.cors_origins.filter((_, i) => i !== idx) });
  }, [srvCfg.cors_origins, updateSrvCfg]);

  useEffect(() => {
    if (activeTab === 'audit') fetchAuditLogs(1);
    if (activeTab === 'notify') fetchNotifyConfig();
    if (activeTab === 'account') {
      fetchServerConfig();
      authApi.me().then(setCurrentUser).catch(() => { });
    }
  }, [activeTab, fetchAuditLogs, fetchNotifyConfig, fetchServerConfig]);

  const handleChangeUsername = async () => {
    setUsernameError('');
    if (newUsername.length < 3) { setUsernameError(s.usernameTooShort); return; }
    setUsernameLoading(true);
    try {
      await authApi.changeUsername(newUsername, usernameVerifyPwd);
      toast('success', s.usernameChanged);
      setNewUsername(''); setUsernameVerifyPwd('');
      // 刷新当前用户信息
      authApi.me().then(setCurrentUser).catch(() => { });
    } catch (err: any) {
      setUsernameError(err?.message || s.usernameFailed);
    } finally { setUsernameLoading(false); }
  };

  const handleChangePwd = async () => {
    setPwdError('');
    if (newPwd.length < 6) { setPwdError(s.pwdTooShort); return; }
    if (newPwd !== confirmPwd) { setPwdError(s.pwdMismatch); return; }
    setPwdLoading(true);
    try {
      await authApi.changePassword(oldPwd, newPwd);
      toast('success', s.pwdChanged);
      setOldPwd(''); setNewPwd(''); setConfirmPwd('');
    } catch (err: any) {
      setPwdError(err?.message || s.pwdFailed);
    } finally { setPwdLoading(false); }
  };

  const handleLogout = useCallback(async () => {
    if (!onLogout) return;
    const logoutLabel = s.logout || 'Logout';
    const logoutConfirm = s.logoutConfirm || 'Log out of the current session? You will need to sign in again with your username and password.';
    const cancelLabel = (t as any).cancel || 'Cancel';
    const ok = await confirm({
      title: logoutLabel,
      message: logoutConfirm,
      confirmText: logoutLabel,
      cancelText: cancelLabel,
      danger: true,
    });
    if (!ok) return;
    await onLogout();
  }, [confirm, onLogout, s, t]);

  const inputCls = "w-full h-9 theme-field rounded-lg px-3 text-[13px] focus:ring-2 focus:ring-primary/30 outline-none transition-all sci-input";
  const labelCls = "text-[12px] font-medium theme-text-muted";
  const rowCls = "bg-white dark:bg-white/[0.04] rounded-xl border border-slate-200/70 dark:border-white/[0.06] divide-y divide-slate-100 dark:divide-white/[0.04] overflow-hidden";

  return (
    <div className="flex-1 flex overflow-hidden bg-[#f5f5f7] dark:bg-[#1c1c1e]">

      {/* ── Mobile drawer overlay ── */}
      {drawerOpen && (
        <div className="md:hidden fixed top-[32px] bottom-[72px] start-0 end-0 z-40 bg-black/40 backdrop-blur-sm" onClick={() => setDrawerOpen(false)} />
      )}

      {/* ── macOS 风格侧边栏 — desktop: static, mobile: slide-out drawer ── */}
      <aside className={`fixed md:static top-[32px] bottom-[72px] md:top-auto md:bottom-auto start-0 z-50 w-64 md:w-56 lg:w-64 shrink-0 border-e border-slate-200/70 dark:border-white/[0.06] bg-[#f5f5f7] dark:bg-[#2c2c2e] md:bg-[#f5f5f7]/80 md:dark:bg-[#2c2c2e]/80 backdrop-blur-xl flex flex-col overflow-y-auto no-scrollbar transform transition-transform duration-200 ease-out ${drawerOpen ? 'translate-x-0' : '-translate-x-full rtl:translate-x-full md:translate-x-0'}`}>
        {/* 用户头像区 */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-slate-200/70 dark:border-white/[0.06]">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-sm font-bold shadow-md">
                  {(currentUser?.username || s.adminDefault).charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-[13px] font-semibold text-slate-800 dark:text-white truncate">{currentUser?.username || s.adminDefault}</p>
            <p className="text-[10px] theme-text-muted">HAClaw-OS</p>
          </div>
        </div>

        {/* 导航列表 */}
        <nav className="flex flex-col gap-0.5 p-2 mt-1">
          {navItems.map(item => (
            <button key={item.id} onClick={() => handleTabSelect(item.id)}
              className={`flex items-center gap-2.5 px-3 py-[7px] rounded-lg text-[13px] transition-all ${activeTab === item.id
                  ? 'bg-primary/15 dark:bg-primary/20 text-primary font-semibold'
                  : 'theme-text-secondary hover:bg-black/[0.04] dark:hover:bg-white/[0.04]'
                }`}>
              <div className="relative">
                <div className={`w-[22px] h-[22px] rounded-md ${item.color} flex items-center justify-center shadow-sm`}>
                  <span className="material-symbols-outlined text-white text-[14px]">{item.icon}</span>
                </div>
              </div>
              {item.label}
            </button>
          ))}
        </nav>
      </aside>

      {/* ── 右侧内容区 ── */}
      <main className="flex-1 overflow-y-auto custom-scrollbar neon-scrollbar flex flex-col">
        {/* Mobile header with hamburger */}
        <div className="md:hidden flex items-center gap-2.5 px-4 pt-3 pb-1 shrink-0">
          <button onClick={() => setDrawerOpen(true)} className="p-1.5 -ms-1 rounded-lg text-slate-500 dark:text-white/50 hover:text-primary hover:bg-primary/5 transition-all">
            <span className="material-symbols-outlined text-[20px]">menu</span>
          </button>
          <span className="text-[13px] font-semibold text-slate-700 dark:text-white/80">
            {navItems.find(n => n.id === activeTab)?.label}
          </span>
        </div>
        <div className="max-w-4xl mx-auto p-4 md:p-6 lg:p-8 w-full">

          {/* 账户安全 */}
          {activeTab === 'account' && (
            <div className="space-y-5">
              <h2 className="text-[22px] font-bold text-slate-800 dark:text-white">{s.account}</h2>

              {/* 修改用户名 */}
              <div className={rowCls}>
                <div className="px-4 py-3">
                  <p className="text-[13px] font-semibold text-slate-700 dark:text-white/80 mb-3">{s.changeUsername}</p>
                  <div className="space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3">
                      <label className={`${labelCls} sm:w-24 sm:shrink-0 sm:text-end`}>{s.newUsername}</label>
                      <input type="text" value={newUsername} onChange={e => setNewUsername(e.target.value)} className={inputCls} />
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3">
                      <label className={`${labelCls} sm:w-24 sm:shrink-0 sm:text-end`}>{s.verifyPassword}</label>
                      <input type="password" value={usernameVerifyPwd} onChange={e => setUsernameVerifyPwd(e.target.value)} className={inputCls}
                        onKeyDown={e => e.key === 'Enter' && handleChangeUsername()} />
                    </div>
                    {usernameError && <p className="text-xs text-mac-red sm:ms-[108px]">{usernameError}</p>}
                    <div className="flex justify-end pt-1">
                      <button onClick={handleChangeUsername} disabled={usernameLoading || !newUsername || !usernameVerifyPwd}
                        className="px-5 py-[7px] bg-primary text-white rounded-lg text-[13px] font-medium transition-all disabled:opacity-40 hover:opacity-90 shadow-sm">
                        {usernameLoading ? <span className="material-symbols-outlined text-sm animate-spin align-middle">progress_activity</span> : s.save}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* 修改密码 */}
              <div className={rowCls}>
                <div className="px-4 py-3">
                  <p className="text-[13px] font-semibold text-slate-700 dark:text-white/80 mb-3">{s.changePwd}</p>
                  <div className="space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3">
                      <label className={`${labelCls} sm:w-24 sm:shrink-0 sm:text-end`}>{s.oldPwd}</label>
                      <input type="password" value={oldPwd} onChange={e => setOldPwd(e.target.value)} className={inputCls} />
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3">
                      <label className={`${labelCls} sm:w-24 sm:shrink-0 sm:text-end`}>{s.newPwd}</label>
                      <input type="password" value={newPwd} onChange={e => setNewPwd(e.target.value)} className={inputCls} />
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3">
                      <label className={`${labelCls} sm:w-24 sm:shrink-0 sm:text-end`}>{s.confirmPwd}</label>
                      <input type="password" value={confirmPwd} onChange={e => setConfirmPwd(e.target.value)} className={inputCls}
                        onKeyDown={e => e.key === 'Enter' && handleChangePwd()} />
                    </div>
                    {pwdError && <p className="text-xs text-mac-red sm:ms-[108px]">{pwdError}</p>}
                    <div className="flex justify-end pt-1">
                      <button onClick={handleChangePwd} disabled={pwdLoading || !oldPwd || !newPwd}
                        className="px-5 py-[7px] bg-primary text-white rounded-lg text-[13px] font-medium transition-all disabled:opacity-40 hover:opacity-90 shadow-sm">
                        {pwdLoading ? <span className="material-symbols-outlined text-sm animate-spin align-middle">progress_activity</span> : s.save}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── 访问安全 ── */}
              <div className="pt-2">
                <h2 className="text-[22px] font-bold text-slate-800 dark:text-white">{s.accessSecurity}</h2>
                <p className="text-[12px] theme-text-muted mt-0.5">{s.accessSecurityDesc}</p>
              </div>

              {/* 重启提示 */}
              {srvCfgRestart && (
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200/60 dark:border-amber-500/20">
                  <span className="material-symbols-outlined text-[18px] text-amber-500">warning</span>
                  <div className="flex-1">
                    <p className="text-[12px] font-bold text-amber-700 dark:text-amber-400">{s.restartRequired}</p>
                    <p className="text-[10px] text-amber-600/70 dark:text-amber-400/50 mt-0.5">{s.restartHint}</p>
                  </div>
                </div>
              )}

              <div className={rowCls}>
                <div className="px-4 py-3 space-y-4">
                  {/* 绑定地址 */}
                  <div>
                    <label className={labelCls}>{s.bindAddress}</label>
                    <div className="flex gap-2 mt-1.5">
                      {(['all', 'local', 'custom'] as const).map(mode => (
                        <button key={mode} onClick={() => handleBindModeChange(mode)}
                          className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all border ${
                            bindMode === mode
                              ? 'bg-primary/10 text-primary border-primary/30'
                              : 'theme-field theme-text-muted hover:bg-slate-100 dark:hover:bg-white/10'
                          }`}>
                          {mode === 'all' ? s.bindAll : mode === 'local' ? s.bindLocal : s.bindCustom}
                        </button>
                      ))}
                    </div>
                    {bindMode === 'custom' && (
                      <input type="text" value={srvCfg.bind} onChange={e => updateSrvCfg({ bind: e.target.value })}
                        className={`${inputCls} mt-2`} placeholder="192.168.1.100" />
                    )}
                    <p className="text-[10px] text-slate-400 dark:text-white/20 mt-1.5">{s.bindAddressHint}</p>
                  </div>

                  {/* 监听端口 */}
                  <div>
                    <label className={labelCls}>{s.listenPort}</label>
                    <input type="text" inputMode="numeric" value={srvCfg.port}
                      onChange={e => { const v = e.target.value.replace(/\D/g, ''); const n = parseInt(v) || 0; if (n >= 0 && n <= 65535) updateSrvCfg({ port: n || 18788 }); }}
                      className={`${inputCls} mt-1.5 w-40`} />
                    <p className="text-[10px] text-slate-400 dark:text-white/20 mt-1.5">{s.listenPortHint}</p>
                  </div>

                  {/* CORS 允许来源 */}
                  <div>
                    <label className={labelCls}>{s.corsOrigins}</label>
                    <div className="mt-1.5 space-y-1.5">
                      {srvCfg.cors_origins.map((origin, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <span className="flex-1 text-[12px] theme-text-secondary font-mono theme-field px-3 py-1.5 rounded-lg truncate">{origin}</span>
                          <button onClick={() => handleRemoveCorsOrigin(idx)}
                            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-slate-400 hover:text-red-500 transition-colors">
                            <span className="material-symbols-outlined text-[14px]">close</span>
                          </button>
                        </div>
                      ))}
                      <div className="flex items-center gap-2">
                        <input type="text" value={newCorsOrigin} onChange={e => setNewCorsOrigin(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && handleAddCorsOrigin()}
                          className={`${inputCls} flex-1`} placeholder="https://example.com" />
                        <button onClick={handleAddCorsOrigin} disabled={!newCorsOrigin.trim()}
                          className="px-3 h-9 rounded-lg theme-field hover:bg-slate-200 dark:hover:bg-white/10 text-[11px] font-bold theme-text-secondary disabled:opacity-40 transition-colors">
                          {s.addOrigin}
                        </button>
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-400 dark:text-white/20 mt-1.5">{s.corsOriginsHint}</p>
                  </div>

                  {/* 保存按钮 */}
                  <div className="flex justify-end pt-1">
                    <button onClick={handleSrvCfgSave} disabled={srvCfgSaving || !srvCfgDirty}
                      className="px-5 py-[7px] bg-primary text-white rounded-lg text-[13px] font-medium transition-all disabled:opacity-40 hover:opacity-90 shadow-sm flex items-center gap-1.5">
                      {srvCfgSaving && <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>}
                      {s.save}
                    </button>
                  </div>
                </div>
              </div>

              {onLogout && (
                <div className={rowCls}>
                  <div className="px-4 py-3 flex items-center justify-between gap-4">
                    <div>
                      <p className="text-[13px] font-semibold text-slate-700 dark:text-white/80">{s.logout || 'Logout'}</p>
                      <p className="text-[11px] theme-text-muted mt-1">
                        {s.logoutDesc || 'End the current session and return to the login screen. You will need to sign in again next time.'}
                      </p>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="px-4 py-[7px] rounded-lg text-[13px] font-medium transition-all bg-mac-red text-white hover:opacity-90 shadow-sm shrink-0"
                    >
                      {s.logout || 'Logout'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 异常通知 */}
          {activeTab === 'notify' && (
            <div className="space-y-5">
              <div>
                <h2 className="text-[22px] font-bold text-slate-800 dark:text-white">{s.notify}</h2>
                <p className="text-[12px] theme-text-muted mt-0.5">{s.notifyDesc}</p>
              </div>

              {/* Active channels badge */}
              {notifyActive.length > 0 && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-mac-green/10 border border-mac-green/20">
                  <span className="material-symbols-outlined text-[16px] text-mac-green">check_circle</span>
                  <span className="text-[11px] font-bold text-mac-green">{s.notifyActive}: {notifyActive.join(', ')}</span>
                </div>
              )}

              {/* Reuse hint */}
              {notifyAvailable.some((c: any) => c.type === 'telegram' && c.has_token) && !notifyCfg.notify_telegram_token && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-blue-50 dark:bg-blue-500/5 border border-blue-200/40 dark:border-blue-500/10">
                  <span className="material-symbols-outlined text-[16px] text-blue-500">info</span>
                  <span className="text-[11px] text-blue-600 dark:text-blue-400">{s.notifyReuseHint}</span>
                </div>
              )}

              {/* 通知事件配置 */}
              <div className="rounded-2xl border border-slate-200/60 dark:border-white/[0.06] bg-white dark:bg-white/[0.02] overflow-hidden">
                <div className="px-5 py-3 border-b border-slate-100 dark:border-white/[0.06] flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px] text-amber-500">tune</span>
                  <span className="text-[13px] font-bold text-slate-700 dark:text-white/80">{s.notifyEventsTitle || 'Notification Events'}</span>
                </div>
                <div className="px-5 py-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="material-symbols-outlined text-[16px] text-slate-400 dark:text-white/30">power_settings_new</span>
                      <div>
                        <p className="text-[12px] font-medium text-slate-700 dark:text-white/70">{t.gw?.lifecycleNotifyShutdown || 'Notify shutdown'}</p>
                        <p className="text-[10px] text-slate-400 dark:text-white/30">{t.gw?.lifecycleNotifyShutdownHint || 'Send notification when gateway shuts down'}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        const next = !notifyShutdown;
                        setNotifyShutdown(next);
                        gatewayApi.setLifecycleNotifyConfig({ notify_shutdown: next }).catch(() => {
                          setNotifyShutdown(!next);
                          toast('error', s.notifySaveFail || 'Failed to save');
                        });
                      }}
                      className={`relative w-9 h-5 rounded-full transition-colors shrink-0 ${notifyShutdown ? 'bg-primary' : 'bg-slate-300 dark:bg-white/15'}`}
                    >
                      <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${notifyShutdown ? 'translate-x-4' : ''}`} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Notification channels — data-driven via NotifyChannelCard */}
              {notifyChannelDefs.map(ch => (
                <NotifyChannelCard
                  key={ch.id}
                  channel={ch}
                  config={notifyCfg}
                  onFieldChange={setNf}
                  testLabel={s.notifyTest}
                  inputClassName={inputCls}
                  labelClassName={labelCls}
                  rowClassName={rowCls}
                />
              ))}

              {/* Save button at bottom */}
              <div className="flex justify-end pt-2">
                <button onClick={handleNotifySave} disabled={notifySaving || !notifyDirty}
                  className="flex items-center gap-1.5 px-5 py-[8px] bg-primary text-white rounded-lg text-[12px] font-bold disabled:opacity-40 hover:opacity-90 shadow-sm transition-all">
                  <span className={`material-symbols-outlined text-[16px] ${notifySaving ? 'animate-spin' : ''}`}>{notifySaving ? 'progress_activity' : 'save'}</span>
                  {s.save}
                </button>
              </div>
            </div>
          )}

          {/* 配置快照 */}
          {activeTab === 'snapshot' && (
            <SnapshotTab s={s} inputCls={inputCls} labelCls={labelCls} rowCls={rowCls} />
          )}

          {/* 功能设置 */}
          {activeTab === 'preferences' && (
            <PreferencesTab s={s} pref={(t as any).pref || {}} prefs={prefs} onPrefsChange={handlePrefsChange} inputCls={inputCls} rowCls={rowCls} />
          )}

          {/* 审计日志 */}
          {activeTab === 'audit' && (
            <div className="space-y-5">
              <div>
                <h2 className="text-[22px] font-bold text-slate-800 dark:text-white">{s.auditLog}</h2>
                <p className="text-[12px] theme-text-muted mt-0.5">{s.auditDesc}</p>
              </div>
              <div className={rowCls}>
                {auditLogs.length === 0 ? (
                  <div className="flex flex-col items-center py-10 text-slate-300 dark:text-white/10">
                    <span className="material-symbols-outlined text-4xl mb-2">checklist</span>
                    <span className="text-[12px] text-slate-400 dark:text-white/20">{s.noAudit}</span>
                  </div>
                ) : (
                  <>
                    {auditLogs.map((log: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between px-4 py-2.5 gap-3">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className={`w-2 h-2 rounded-full shrink-0 ${log.result === 'success' ? 'bg-mac-green' : 'bg-mac-red'}`} />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-[13px] font-medium text-slate-700 dark:text-white/70">{log.action || '--'}</span>
                              <span className="text-[10px] text-slate-400 dark:text-white/20 font-mono">{log.username || '--'}</span>
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] text-slate-400 dark:text-white/20">{log.created_at ? new Date(log.created_at).toLocaleString() : '--'}</span>
                              <span className="text-[10px] text-slate-300 dark:text-white/10 font-mono">{log.ip || ''}</span>
                            </div>
                          </div>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold shrink-0 ${log.result === 'success' ? 'bg-mac-green/10 text-mac-green' : 'bg-mac-red/10 text-mac-red'}`}>
                          {log.result === 'success' ? s.success : s.failed}
                        </span>
                      </div>
                    ))}
                    {auditLogs.length < auditTotal && (
                      <div className="px-4 py-3">
                        <button onClick={() => fetchAuditLogs(auditPage + 1)} disabled={auditLoading}
                          className="w-full py-2 text-[12px] text-primary font-medium hover:bg-primary/5 rounded-lg transition-colors disabled:opacity-40">
                          {auditLoading ? <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span> : s.loadMore}
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          {/* 更新升级 */}
          {activeTab === 'update' && (
            <UpdateTab s={s} language={language} inputCls={inputCls} rowCls={rowCls} />
          )}



        </div>
      </main>

    </div>
  );
};

export default Settings;
