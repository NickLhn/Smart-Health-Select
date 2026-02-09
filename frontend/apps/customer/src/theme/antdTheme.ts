import type { ThemeConfig } from 'antd';

export const antdTheme: ThemeConfig = {
  token: {
    colorPrimary: '#00B96B',
    colorInfo: '#00B96B',
    colorSuccess: '#10B981',
    colorWarning: '#F59E0B',
    colorError: '#EF4444',
    colorTextBase: '#1F2937',
    colorBgBase: '#ffffff',
    borderRadius: 12,
    wireframe: false,
    fontFamily: '"Plus Jakarta Sans", Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
  components: {
    Button: {
      controlHeight: 44,
      borderRadius: 12,
      fontWeight: 600,
      defaultShadow: '0 2px 0 rgba(0, 0, 0, 0.02)',
      primaryShadow: '0 4px 14px 0 rgba(0, 185, 107, 0.3)',
    },
    Input: {
      controlHeight: 44,
      borderRadius: 12,
      colorBorder: '#E5E7EB',
      hoverBorderColor: '#00B96B',
      activeBorderColor: '#00B96B',
    },
    Card: {
      borderRadiusLG: 20,
      boxShadowTertiary: '0 4px 20px -2px rgba(0, 0, 0, 0.05)',
    },
    Layout: {
      bodyBg: '#F8FAFC',
      headerBg: '#ffffff',
      siderBg: '#ffffff',
    },
    Menu: {
      itemBorderRadius: 8,
    }
  },
};
