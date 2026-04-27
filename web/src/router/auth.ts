import type { RouteLocationNormalized, RouteLocationRaw } from 'vue-router';

const DEFAULT_AUTH_REDIRECT: RouteLocationRaw = { name: 'Workspace' };

export const buildLoginRedirectLocation = (
  targetRoute: RouteLocationNormalized,
): RouteLocationRaw => {
  const redirect = targetRoute.fullPath !== '/' ? targetRoute.fullPath : undefined;
  return {
    name: 'Login',
    query: redirect ? { redirect } : undefined,
    replace: true,
  };
};

export const resolvePostAuthRedirect = (rawRedirect: unknown): RouteLocationRaw => {
  if (
    typeof rawRedirect !== 'string'
    || rawRedirect === ''
    || !rawRedirect.startsWith('/')
    || rawRedirect.startsWith('//')
    || rawRedirect.startsWith('/login')
  ) {
    return DEFAULT_AUTH_REDIRECT;
  }

  return {
    path: rawRedirect,
    replace: true,
  };
};
