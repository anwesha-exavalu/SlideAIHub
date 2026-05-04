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
  miniLogo: 'mini-logo',
  headerTitle: 'header-title',
  headerSubtitle: 'header-subtitle',
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
  agentNameLink: 'agent-name-link',
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
