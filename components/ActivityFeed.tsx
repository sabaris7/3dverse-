import React from 'react';
import { MessageSquare, FileCheck, UserPlus, Upload, Circle } from 'lucide-react';

const EVENTS = [
  {
    id: 1,
    type: 'comment',
    user: 'Sarah Chen',
    action: 'commented on',
    target: 'Suspension Arm Gen3',
    time: '10 minutes ago',
    icon: MessageSquare,
    color: 'text-blue-500',
    bg: 'bg-blue-50',
    detail: '"We need to double check the tolerance on this pivot point."'
  },
  {
    id: 2,
    type: 'approve',
    user: 'Mike Ross',
    action: 'approved',
    target: 'Main Assembly Unit',
    time: '2 hours ago',
    icon: FileCheck,
    color: 'text-green-500',
    bg: 'bg-green-50',
    detail: null
  },
  {
    id: 3,
    type: 'upload',
    user: 'Alex Rivera',
    action: 'uploaded version 2.4 of',
    target: 'Turbine Housing',
    time: '4 hours ago',
    icon: Upload,
    color: 'text-brand-primary',
    bg: 'bg-brand-primary/10',
    detail: null
  },
  {
    id: 4,
    type: 'invite',
    user: 'System',
    action: 'invited you to review',
    target: 'Brake Caliper Prototype',
    time: 'Yesterday',
    icon: UserPlus,
    color: 'text-purple-500',
    bg: 'bg-purple-50',
    detail: null
  }
];

const ActivityFeed = () => {
  return (
    <div className="p-4 md:p-8 max-w-[800px] mx-auto space-y-8 animate-in fade-in duration-500">
       <div>
          <h2 className="text-3xl font-bold text-text-primary">Activity Feed</h2>
          <p className="text-text-secondary mt-1">Latest updates across your team.</p>
        </div>

        <div className="relative border-l-2 border-surface-secondary ml-4 space-y-8">
          {EVENTS.map((event) => (
            <div key={event.id} className="relative pl-8">
              {/* Timeline Dot */}
              <div className={`absolute -left-[17px] top-1 w-8 h-8 rounded-full border-4 border-white ${event.bg} ${event.color} flex items-center justify-center shadow-sm`}>
                <event.icon size={14} />
              </div>

              {/* Content */}
              <div className="bg-white p-5 rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.03)] border border-surface-secondary/50">
                 <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-bold text-text-primary">{event.user}</span>
                    <span className="text-text-secondary text-sm">{event.action}</span>
                    <span className="font-bold text-brand-primary cursor-pointer hover:underline">{event.target}</span>
                 </div>
                 <div className="text-xs text-text-muted font-medium mb-3">{event.time}</div>
                 
                 {event.detail && (
                   <div className="bg-surface-secondary/50 p-3 rounded-xl text-sm text-text-secondary italic border-l-2 border-brand-secondary">
                     {event.detail}
                   </div>
                 )}
              </div>
            </div>
          ))}
        </div>
    </div>
  );
};

export default ActivityFeed;
