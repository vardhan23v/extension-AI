import React from 'react';
import { Link } from 'react-router-dom';
import { MoreHorizontal } from 'lucide-react';
import { Badge, IconButton, Menu } from '../../components/ui';
import { timeAgo, AUDIT_STATUS, PROJECT_STATUS } from '../../lib/format';

export const ProjectRow = ({ project, menuItems }) => {
  const audit = AUDIT_STATUS[project.auditStatus];
  const status = PROJECT_STATUS[project.status] || PROJECT_STATUS.draft;
  return (
    <li className="group relative flex items-center gap-4 px-4 py-3.5 transition-colors duration-fast hover:bg-surface-2/60">
      <div className="min-w-0 flex-1">
        <Link to={`/projects/${project.id}`} className="block truncate text-sm font-medium after:absolute after:inset-0 focus:outline-none focus-visible:after:ring-2 focus-visible:after:ring-primary">
          {project.title}
        </Link>
        <p className="truncate text-[13px] text-muted">{project.description || project.prompt}</p>
      </div>
      <div className="hidden md:flex items-center gap-1.5">
        <Badge tone={status.tone}>{status.label}</Badge>
        {audit && <Badge tone={audit.tone}>{audit.label}</Badge>}
      </div>
      <span className="hidden w-12 text-right font-mono text-[12px] text-subtle tabular sm:block" title="Files">{project.fileCount}f</span>
      <span className="hidden w-28 text-right text-[12px] text-subtle sm:block">{timeAgo(project.updatedAt)}</span>
      <div className="relative z-10">
        <Menu
          items={menuItems(project)}
          trigger={
            <IconButton label={`Actions for ${project.title}`} size="icon-sm">
              <MoreHorizontal className="h-4 w-4" />
            </IconButton>
          }
        />
      </div>
    </li>
  );
};

export const ProjectRowSkeleton = () => (
  <li className="flex items-center gap-3 px-4 py-3">
    <div className="flex-1 space-y-2">
      <div className="skeleton h-3.5 w-1/3" />
      <div className="skeleton h-3 w-2/3" />
    </div>
  </li>
);
