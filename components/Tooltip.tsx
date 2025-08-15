import React from 'react';

const Tooltip: React.FC<{ content: React.ReactNode, children: React.ReactNode; className?: string }> = ({ content, children, className }) => {
  return (
    <div className={`relative flex items-center group ${className}`}>
      {children}
      <div
        className="absolute bottom-full mb-2 w-72 p-3 bg-popover text-popover-foreground text-xs rounded-lg shadow-2xl opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none z-[99]"
        role="tooltip"
      >
        {content}
      </div>
    </div>
  );
};

export default Tooltip;
