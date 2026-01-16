import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Settings, 
  FileText, 
  Package, 
  Key, 
  Users, 
  Link,
  Sliders
} from 'lucide-react';

interface ConfigCard {
  title: string;
  description: string;
  icon: React.ElementType;
  path: string;
  color: string;
}

const configCards: ConfigCard[] = [
  {
    title: 'User Management',
    description: 'Create and manage Admin and CSR users',
    icon: Users,
    path: '/admin/users',
    color: 'bg-blue-500/10 text-blue-500',
  },
  {
    title: 'Template Management',
    description: 'Create, edit, and version document templates',
    icon: FileText,
    path: '/admin/templates',
    color: 'bg-green-500/10 text-green-500',
  },
  {
    title: 'Packet Management',
    description: 'Create packets and assign templates with order',
    icon: Package,
    path: '/admin/packets',
    color: 'bg-purple-500/10 text-purple-500',
  },
  {
    title: 'Field Dictionary',
    description: 'Define data fields and their properties',
    icon: Key,
    path: '/admin/fields',
    color: 'bg-orange-500/10 text-orange-500',
  },
  {
    title: 'Template Field Mapping',
    description: 'Map fields to templates with transform rules',
    icon: Link,
    path: '/admin/field-maps',
    color: 'bg-cyan-500/10 text-cyan-500',
  },
  {
    title: 'System Settings',
    description: 'Configure application settings and preferences',
    icon: Sliders,
    path: '/admin/settings',
    color: 'bg-red-500/10 text-red-500',
  },
];

export const ConfigurationPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="page-container">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Configuration</h1>
        <p className="text-muted-foreground mt-1">Manage system settings and data</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {configCards.map((card) => (
          <button
            key={card.path}
            onClick={() => navigate(card.path)}
            className="section-card text-left hover:shadow-lg transition-all duration-200 hover:-translate-y-1 group"
          >
            <div className="flex items-start gap-4">
              <div className={`h-12 w-12 rounded-lg flex items-center justify-center ${card.color} group-hover:scale-110 transition-transform`}>
                <card.icon className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground mb-1">{card.title}</h3>
                <p className="text-sm text-muted-foreground">{card.description}</p>
              </div>
            </div>
          </button>
        ))}
      </div>

      <div className="section-card mt-8 bg-muted/50">
        <div className="flex items-start gap-4">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Settings className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-medium text-foreground mb-2">Admin Configuration Guide</h3>
            <div className="text-sm text-muted-foreground space-y-2">
              <p>
                <strong>1. Field Dictionary:</strong> Start by defining all the data fields your documents need (borrower info, loan terms, property details).
              </p>
              <p>
                <strong>2. Templates:</strong> Upload and register your DOCX document templates with state and product type assignments.
              </p>
              <p>
                <strong>3. Template Field Mapping:</strong> Connect fields from the dictionary to each template and set required flags and transform rules.
              </p>
              <p>
                <strong>4. Packets:</strong> Bundle related templates into packets for specific state/product combinations.
              </p>
              <p>
                <strong>5. Users:</strong> Assign CSR and Admin roles to team members.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfigurationPage;
