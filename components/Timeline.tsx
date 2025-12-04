import * as React from 'react';
import { TimelineEvent } from '../types';

interface TimelineProps {
  events: TimelineEvent[];
}

const Timeline: React.FC<TimelineProps> = ({ events }) => {
  return (
    <div className="relative border-l-2 border-navy/10 ml-3 my-8 space-y-8">
      {events.map((event, index) => (
        <div key={index} className="mb-8 ml-6 relative">
          <span className="absolute -left-[33px] flex h-6 w-6 items-center justify-center rounded-full bg-white ring-4 ring-slate">
            <span className="h-2.5 w-2.5 rounded-full bg-gold" aria-hidden="true" />
          </span>
          <h3 className="flex items-center mb-1 text-lg font-serif font-semibold text-navy">
            {event.title}
            <span className="ml-3 text-sm font-sans font-medium text-gold bg-navy/5 px-2 py-0.5 rounded">
              {event.year}
            </span>
          </h3>
          <p className="mb-4 text-base font-normal text-gray-500 font-sans leading-relaxed">
            {event.description}
          </p>
        </div>
      ))}
    </div>
  );
};

export default Timeline;