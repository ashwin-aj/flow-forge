// Utility functions for responsive behavior
export const useMediaQuery = (query: string): boolean => {
  if (typeof window === 'undefined') return false;
  
  const mediaQuery = window.matchMedia(query);
  return mediaQuery.matches;
};

export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px'
};

export const isSmallScreen = (): boolean => {
  return useMediaQuery(`(max-width: ${breakpoints.lg})`);
};

export const isMediumScreen = (): boolean => {
  return useMediaQuery(`(min-width: ${breakpoints.md}) and (max-width: ${breakpoints.lg})`);
};

export const isLargeScreen = (): boolean => {
  return useMediaQuery(`(min-width: ${breakpoints.lg})`);
};