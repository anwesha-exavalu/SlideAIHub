import '../App.css';

export const loginClassNames = {
  screen: 'login-screen',
  card: 'login-card',
  brandSection: 'brand-section',
  brandLogo: 'brand-logo',
  brandTitle: 'brand-title',
  brandSubtitle: 'brand-subtitle',
  formHelperRow: 'form-helper-row',
  forgotLink: 'forgot-link',
  loginButton: 'login-button',
  forgotCopy: 'forgot-copy',
  forgotActions: 'forgot-actions',
};

export const layoutClassNames = {
  layout: 'dashboard-layout',
  header: 'dashboard-header',
  brandMini: 'brand-mini',
  brandMark: 'brand-mark',
  brandMarkIcon: 'brand-mark-icon',
  brandCopy: 'brand-copy',
  miniLogo: 'mini-logo',
  headerRight: 'header-right',
  headerLogo: 'header-logo',
  headerWordmark: 'header-wordmark',
  headerTitle: 'header-title',
  headerSubtitle: 'header-subtitle',
  headerActions: 'header-actions',
  headerUtility: 'header-utility',
  headerLogoutButton: 'header-logout-button',
  headerProfile: 'header-profile',
  headerProfileItem: 'header-profile-item',
  headerProfileIcon: 'header-profile-icon',
  headerProfileText: 'header-profile-text',
  headerProfileLabel: 'header-profile-label',
  headerProfileValue: 'header-profile-value',
  content: 'dashboard-content',
  welcomeCard: 'welcome-card',
  userAvatar: 'user-avatar',
  welcomeCaption: 'welcome-caption',
  welcomeName: 'welcome-name',
};

export const tableClassNames = {
  card: 'table-card',
  table: 'agent-table',
  agentAvatar: 'agent-avatar',
  agentAvatarCopilot: 'agent-avatar-copilot',
  agentNameButton: 'agent-name-button',
  agentNameText: 'agent-name-text',
  categoryTag: 'category-tag',
  categoryIcon: 'category-icon',
  metricsViewButton: 'metrics-view-button',
  registerButton: 'register-button',
  agentRowActive: 'agent-row-active',
  agentDetailPanel: 'agent-detail-panel',
  agentDetailHeader: 'agent-detail-header',
  agentDetailEyebrow: 'agent-detail-eyebrow',
  agentDetailTitle: 'agent-detail-title',
  agentDetailMeta: 'agent-detail-meta',
  agentDetailMetaText: 'agent-detail-meta-text',
  agentDetailCopy: 'agent-detail-copy',
  agentDetailGrid: 'agent-detail-grid',
  agentDetailItem: 'agent-detail-item',
  agentDetailItemLabel: 'agent-detail-item-label',
  agentDetailItemValue: 'agent-detail-item-value',
  agentDetailLink: 'agent-detail-link',
};

export const agentPageClassNames = {
  layout: 'agent-page-layout',
  content: 'agent-page-content',
  card: 'agent-page-card',
  title: 'agent-page-title',
  copy: 'agent-page-copy',
  meta: 'agent-page-meta',
  actions: 'agent-page-actions',
};

export const createLoginBackgroundStyle = (backgroundImage) => ({
  backgroundImage: `linear-gradient(130deg, rgba(72, 52, 153, 0.58), rgba(31, 41, 55, 0.46)), url(${backgroundImage})`,
});
