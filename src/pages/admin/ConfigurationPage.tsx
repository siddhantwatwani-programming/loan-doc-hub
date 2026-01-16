import React from 'react';
import { Settings, Sliders, Database, Bell } from 'lucide-react';

export const ConfigurationPage: React.FC = () => {
  return (
    <div className="page-container">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Configuration</h1>
        <p className="text-muted-foreground mt-1">Manage system settings</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="section-card hover:shadow-lg transition-shadow cursor-pointer">
          <div className="flex items-center gap-4 mb-4">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <Sliders className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Loan Types</h3>
              <p className="text-sm text-muted-foreground">Configure available loan types</p>
            </div>
          </div>
        </div>

        <div className="section-card hover:shadow-lg transition-shadow cursor-pointer">
          <div className="flex items-center gap-4 mb-4">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <Database className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Data Fields</h3>
              <p className="text-sm text-muted-foreground">Customize form fields</p>
            </div>
          </div>
        </div>

        <div className="section-card hover:shadow-lg transition-shadow cursor-pointer">
          <div className="flex items-center gap-4 mb-4">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <Bell className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Notifications</h3>
              <p className="text-sm text-muted-foreground">Email and alert settings</p>
            </div>
          </div>
        </div>

        <div className="section-card hover:shadow-lg transition-shadow cursor-pointer">
          <div className="flex items-center gap-4 mb-4">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <Settings className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">General</h3>
              <p className="text-sm text-muted-foreground">System preferences</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfigurationPage;
