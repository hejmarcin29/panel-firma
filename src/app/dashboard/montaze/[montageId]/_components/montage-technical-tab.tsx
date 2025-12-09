'use client';

import { AuditForm } from './technical/audit-form';
import { MaterialManager } from './technical/material-manager';
import type { Montage } from '../../utils';
import type { TechnicalAuditData, MaterialLogData } from '../../technical-data';

interface MontageTechnicalTabProps {
  montage: Montage;
  userRoles: string[];
}

export function MontageTechnicalTab({ montage, userRoles }: MontageTechnicalTabProps) {
  const isAdmin = userRoles.includes('admin');
  const isMeasurer = userRoles.includes('measurer');
  const isInstaller = userRoles.includes('installer');

  // Determine role for components
  let role: 'admin' | 'installer' | 'measurer' = 'installer';
  if (isAdmin) role = 'admin';
  else if (isMeasurer) role = 'measurer';

  // Cast JSON data to types
  const technicalAudit = montage.technicalAudit as unknown as TechnicalAuditData | null;
  const materialLog = montage.materialLog as unknown as MaterialLogData | null;

  return (
    <div className="space-y-6">
      {/* Sekcja 1: Audyt (Dla Pomiarowca i Admina, Montażysta tylko podgląd) */}
      <AuditForm 
        montageId={montage.id} 
        initialData={technicalAudit} 
        readOnly={!isMeasurer && !isAdmin}
      />

      {/* Sekcja 2: Materiały (Dla Admina i Montażysty) */}
      <MaterialManager 
        montageId={montage.id} 
        initialData={materialLog}
        role={role}
      />
    </div>
  );
}
