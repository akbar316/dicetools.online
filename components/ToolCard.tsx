import React, { useRef, MouseEvent } from 'react';
import { Link } from 'react-router-dom';
import type { Tool } from '../types';

interface ToolCardProps {
  tool: Tool;
}

const ToolCard: React.FC<ToolCardProps> = ({ tool }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    const container = containerRef.current;
    if (!container) return;
    const card = container.firstChild as HTMLElement;
    if (!card) return;

    const { left, top, width, height } = container.getBoundingClientRect();
    const x = e.clientX - left;
    const y = e.clientY - top;

    const rotateX = (-(y - height / 2) / height) * 25;
    const rotateY = ((x - width / 2) / width) * 25;
    
    card.style.setProperty('--rotateX', `${rotateX}deg`);
    card.style.setProperty('--rotateY', `${rotateY}deg`);
  };

  const handleMouseLeave = () => {
    const container = containerRef.current;
    if (!container) return;
    const card = container.firstChild as HTMLElement;
    if (!card) return;

    card.style.setProperty('--rotateX', '0deg');
    card.style.setProperty('--rotateY', '0deg');
  };

  return (
    <div
      ref={containerRef}
      className="card-3d-container h-full"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <Link
        to={tool.path}
        className="card-3d bg-brand-surface p-6 rounded-lg shadow-lg hover:shadow-xl hover:shadow-brand-primary/20 flex flex-col items-start h-full"
      >
        <div className="text-brand-primary mb-3">{tool.icon}</div>
        <h3 className="text-lg font-semibold text-brand-text-primary mb-2">{tool.name}</h3>
        <p className="text-sm text-brand-text-secondary flex-grow">{tool.description}</p>
      </Link>
    </div>
  );
};

export default ToolCard;
