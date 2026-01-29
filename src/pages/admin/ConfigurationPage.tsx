import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Package, 
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
    title: 'Packet Management',
    description: 'Create packets and assign templates with order',
    icon: Package,
    path: '/admin/packets',
    color: 'bg-purple-500/10 text-purple-500',
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
        <p className="text-muted-foreground mt-1">Manage packets and system settings</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
    </div>
  );
};

export default ConfigurationPage;
