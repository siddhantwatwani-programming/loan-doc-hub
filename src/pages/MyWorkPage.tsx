import React from 'react';
import { useLocation } from 'react-router-dom';
import { MyWorkSideNavigation } from '@/components/mywork/MyWorkSideNavigation';

const getPageTitle = (pathname: string): string => {
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length < 3) return 'My Work';
  
  // Convert slug to title
  const lastSegment = segments[segments.length - 1];
  return lastSegment
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

const getSectionTitle = (pathname: string): string => {
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length < 2) return '';
  
  const sectionSegment = segments[1];
  return sectionSegment
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

export const MyWorkPage: React.FC = () => {
  const location = useLocation();
  const pageTitle = getPageTitle(location.pathname);
  const sectionTitle = getSectionTitle(location.pathname);

  return (
    <div className="flex h-[calc(100vh-0px)] overflow-hidden">
      <MyWorkSideNavigation />
      <div className="flex-1 overflow-y-auto p-6">
        <div className="mb-6">
          {sectionTitle && (
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
              {sectionTitle}
            </p>
          )}
          <h1 className="text-2xl font-bold text-foreground">{pageTitle}</h1>
        </div>
        <div className="section-card">
          <p className="text-muted-foreground">Coming Soon</p>
        </div>
      </div>
    </div>
  );
};

export default MyWorkPage;
