import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Users, Mail, Phone } from 'lucide-react';

interface Borrower {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dealsCount: number;
  createdAt: string;
}

const mockBorrowers: Borrower[] = [
  { id: '1', firstName: 'John', lastName: 'Smith', email: 'john.smith@email.com', phone: '(555) 123-4567', dealsCount: 2, createdAt: '2026-01-10' },
  { id: '2', firstName: 'Jane', lastName: 'Doe', email: 'jane.doe@email.com', phone: '(555) 234-5678', dealsCount: 1, createdAt: '2026-01-08' },
  { id: '3', firstName: 'Robert', lastName: 'Johnson', email: 'r.johnson@email.com', phone: '(555) 345-6789', dealsCount: 3, createdAt: '2026-01-05' },
  { id: '4', firstName: 'Sarah', lastName: 'Williams', email: 's.williams@email.com', phone: '(555) 456-7890', dealsCount: 1, createdAt: '2026-01-03' },
];

export const BorrowersPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredBorrowers = mockBorrowers.filter(
    (borrower) =>
      `${borrower.firstName} ${borrower.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      borrower.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="page-container">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Borrowers</h1>
          <p className="text-muted-foreground mt-1">Manage borrower information</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Add Borrower
        </Button>
      </div>

      <div className="section-card mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {filteredBorrowers.length === 0 ? (
        <div className="section-card text-center py-12">
          <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">No borrowers found</h3>
          <p className="text-muted-foreground">
            {searchQuery ? 'Try adjusting your search' : 'Add your first borrower to get started'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBorrowers.map((borrower) => (
            <div 
              key={borrower.id} 
              className="section-card hover:shadow-lg transition-shadow cursor-pointer"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-lg font-semibold text-primary">
                    {borrower.firstName[0]}{borrower.lastName[0]}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {borrower.dealsCount} {borrower.dealsCount === 1 ? 'deal' : 'deals'}
                </span>
              </div>
              <h3 className="font-semibold text-foreground">
                {borrower.firstName} {borrower.lastName}
              </h3>
              <div className="mt-3 space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  <span className="truncate">{borrower.email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  <span>{borrower.phone}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BorrowersPage;
