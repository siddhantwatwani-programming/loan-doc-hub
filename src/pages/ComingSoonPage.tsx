import React from 'react';

const ComingSoonPage: React.FC = () => {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold text-foreground tracking-tight" style={{ fontFamily: "'Brush Script MT', cursive" }}>
          Coming
        </h1>
        <p className="text-3xl font-extrabold uppercase tracking-widest text-foreground/80">
          SOON
        </p>
      </div>
    </div>
  );
};

export default ComingSoonPage;
