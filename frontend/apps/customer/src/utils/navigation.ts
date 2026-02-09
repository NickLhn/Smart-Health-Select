export const getCustomerTopNavKey = (pathname: string) => {
  if (pathname === '/' || pathname === '') return '/';
  if (pathname.startsWith('/medicine') || pathname.startsWith('/product') || pathname.startsWith('/shop')) return '/medicine';
  if (pathname.startsWith('/category')) return '/category';
  if (pathname.startsWith('/health')) return '/health';
  if (pathname.startsWith('/orders') || pathname.startsWith('/order')) return '/orders';
  return '';
};

export const getCustomerBottomNavKey = (pathname: string) => {
  if (pathname === '/' || pathname === '') return '/';
  if (pathname.startsWith('/category')) return '/category';
  if (pathname.startsWith('/cart')) return '/cart';
  if (pathname.startsWith('/profile')) return '/profile';
  return '';
};

export const shouldHideCustomerBottomNav = (pathname: string) => {
  return [
    /^\/product\/\d+/,
    /^\/order\/checkout/,
    /^\/payment\/\d+/,
    /^\/refund\/apply\/\d+/,
    /^\/ai-consultation/,
    /^\/login$/,
    /^\/register$/,
    /^\/forgot-password$/,
  ].some((re) => re.test(pathname));
};
