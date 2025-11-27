import React, { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";

interface ExpandableCardProps {
  className?: string;
  header?: React.ReactNode;
  actions?: React.ReactNode;
  children?: React.ReactNode; // main content
  details?: React.ReactNode;  // collapsible content
  defaultExpanded?: boolean;
}

export const ExpandableCard: React.FC<ExpandableCardProps> = ({
  className,
  header,
  actions,
  children,
  details,
  defaultExpanded = false,
}) => {
  const [expanded, setExpanded] = useState<boolean>(defaultExpanded);

  return (
    <Card className={"hover:shadow-md transition-shadow " + (className || "")}> 
      {header || actions ? (
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div className="min-w-0">{header}</div>
            <div className="flex items-center gap-2">
              {actions}
              {details && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => setExpanded((v) => !v)}
                  aria-label={expanded ? "Recolher detalhes" : "Expandir detalhes"}
                >
                  {expanded ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      ) : null}
      <CardContent className="p-4">
        {children}
        {details && (
          <div className={"mt-3 border-t pt-3 " + (expanded ? "block" : "hidden")}> 
            {details}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ExpandableCard;