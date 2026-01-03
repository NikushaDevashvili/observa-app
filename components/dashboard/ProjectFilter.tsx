"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Filter } from "lucide-react";

interface Project {
  id: string;
  name: string;
}

interface ProjectFilterProps {
  projects: Project[];
  selectedProjectId?: string;
  onChange: (projectId?: string) => void;
}

export default function ProjectFilter({
  projects,
  selectedProjectId,
  onChange,
}: ProjectFilterProps) {
  const selectedProject = projects.find((p) => p.id === selectedProjectId);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <Filter className="mr-2 h-4 w-4" />
          {selectedProject ? selectedProject.name : "All Projects"}
          {projects.length > 0 && (
            <span className="ml-2 text-xs text-muted-foreground">
              ({projects.length})
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuItem onClick={() => onChange(undefined)}>
          All Projects
        </DropdownMenuItem>
        {projects.map((project) => (
          <DropdownMenuItem
            key={project.id}
            onClick={() => onChange(project.id)}
          >
            {project.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

