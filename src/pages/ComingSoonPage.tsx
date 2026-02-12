import React from 'react';
import { useLocation } from 'react-router-dom';

const sectionMap: Record<string, string> = {
  '/broker-services/department-alerts': 'Broker Services → Department Alerts',
  '/broker-services/origination': 'Broker Services → Loan Origination Services',
  '/broker-services/documents': 'Broker Services → Loan Documents Processing',
  '/broker-services/intake': 'Broker Services → New Account Intake',
  '/broker-services/servicing': 'Broker Services → Loan Servicing',
  '/broker-services/operations': 'Broker Services → Operations',
  '/broker-services/default': 'Broker Services → Default Services',
  '/accounting': 'Accounting',
  '/system-admin': 'System Administration',
  '/c-level': 'C Level Module',
  '/my-work': 'My Work',
};

function getSectionTitle(pathname: string): string | null {
  // Try exact match first
  if (sectionMap[pathname]) return sectionMap[pathname];
  // Try prefix match (longest first)
  const sorted = Object.keys(sectionMap).sort((a, b) => b.length - a.length);
  for (const prefix of sorted) {
    if (pathname.startsWith(prefix)) return sectionMap[prefix];
  }
  return null;
}

const ComingSoonPage: React.FC = () => {
  const location = useLocation();
  const sectionTitle = getSectionTitle(location.pathname);

  return (
    <div className="flex flex-col min-h-[60vh]">
      {sectionTitle && (
        <div className="px-6 pt-6 pb-2">
          <h2 className="text-lg font-semibold text-foreground text-left">{sectionTitle}</h2>
        </div>
      )}
      <div className="flex items-center justify-center flex-1">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-foreground tracking-tight" style={{ fontFamily: "'Brush Script MT', cursive" }}>
            Coming
          </h1>
          <p className="text-3xl font-extrabold uppercase tracking-widest text-foreground/80">
            SOON
          </p>
          <p className="text-sm text-muted-foreground pt-2">
            This module is under development. Data will be available soon.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ComingSoonPage;
