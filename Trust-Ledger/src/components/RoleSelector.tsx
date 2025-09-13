import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useRole } from "@/hooks/useRole";
import { Search, Users, Heart, ClipboardList } from "lucide-react";

export function RoleSelector() {
  const { currentRole, switchRole, getRoleConfig } = useRole();

  const roles = [
    { id: 'auditor', icon: Search, color: 'bg-primary' },
    { id: 'citizen', icon: Users, color: 'bg-secondary' },
    { id: 'donor', icon: Heart, color: 'bg-accent' },
    { id: 'committee', icon: ClipboardList, color: 'bg-muted' },
  ] as const;

  return (
    <div className="mb-6" data-testid="role-selector-panel">
      <div className="flex flex-wrap gap-2 mb-4">
        {roles.map((role) => {
          const config = getRoleConfig(role.id);
          const isActive = currentRole === role.id;
          
          return (
            <Button
              key={role.id}
              onClick={() => switchRole(role.id)}
              variant={isActive ? "default" : "secondary"}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                isActive 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-secondary text-secondary-foreground hover:bg-accent hover:text-accent-foreground'
              }`}
              data-testid={`button-role-${role.id}`}
            >
              <role.icon className="w-4 h-4 mr-2" />
              {config.label}
            </Button>
          );
        })}
      </div>
      
      {/* Current Role Description */}
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="flex items-center space-x-3 mb-2">
          <Badge variant="default" className="bg-primary text-primary-foreground" data-testid="badge-current-role">
            {getRoleConfig(currentRole).label}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground" data-testid="text-role-description">
          {getRoleConfig(currentRole).description}
        </p>
      </div>
    </div>
  );
}
