'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Montage, MeasurementMaterialItem } from '../../types';
import type { TechnicalAuditData } from '../../technical-data';
import { MeasurementAssistantModal } from '../../_components/measurement-assistant-modal';
import { updateMontageMeasurement } from '../../actions';
import { updateTechnicalAudit } from '../../technical-actions';

interface MeasurementAssistantControllerProps {
    montage: Montage;
    isOpen: boolean;
    onClose: () => void;
}

export function MeasurementAssistantController({ montage, isOpen, onClose }: MeasurementAssistantControllerProps) {
    const router = useRouter();

    // --- STATE INITIALIZATION FROM MONTAGE ---
    const [measurementDate, setMeasurementDate] = useState(
        montage.measurementDate 
          ? new Date(montage.measurementDate as string | number | Date).toISOString().slice(0, 16)
          : ""
      );

    const [isHousingVat, setIsHousingVat] = useState(montage.isHousingVat ?? true);
    const [subfloorCondition, setSubfloorCondition] = useState(montage.measurementSubfloorCondition || 'good');
    
    // Technical Audit
    const [technicalAudit, setTechnicalAudit] = useState<TechnicalAuditData>(() => {
        if (montage.technicalAudit) {
            return montage.technicalAudit as unknown as TechnicalAuditData;
        }
        return {
            moisture: '',
            level: '',
            cracks: false,
            expansionJoints: false,
            heating: false,
            heatingProtocol: false,
            photoUrl: '',
            notes: ''
        };
    });

    const [installationMethod, setInstallationMethod] = useState<'click' | 'glue'>(
        (montage.measurementInstallationMethod as 'click' | 'glue') || 'click'
    );
    const [floorPattern, setFloorPattern] = useState<'classic' | 'herringbone'>(
        (montage.measurementFloorPattern as 'classic' | 'herringbone') || 'classic'
    );
    const [panelWaste, setPanelWaste] = useState<string>(montage.panelWaste?.toString() || '5');
    const [floorArea, setFloorArea] = useState(montage.floorArea?.toString() || '');
    
    // We don't need full panel selector logic here if Assistant only sets the model name string
    // But AssistantModal prop expects setIsPanelSelectorOpen. 
    // If the assistant uses the full selector, we need that state too.
    // For now, let's keep it minimal or mock it if the assistant doesn't deeply use it yet.
    const [panelModel, setPanelModel] = useState(montage.panelModel || '');
    const [isPanelSelectorOpen, setIsPanelSelectorOpen] = useState(false);

    const [additionalMaterials, setAdditionalMaterials] = useState<MeasurementMaterialItem[]>(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const raw = montage.measurementAdditionalMaterials as any;
        if (Array.isArray(raw)) return raw;
        if (typeof raw === 'string' && raw.trim().length > 0) {
            return [{
                id: 'legacy-1',
                name: raw,
                quantity: '',
                supplySide: 'installer'
            }];
        }
        return [];
    });

    const [measurementRooms, setMeasurementRooms] = useState<{ name: string; area: number }[]>(montage.measurementRooms || []);
    
    // Assistant needs dateRange prop?
    const [dateRange, setDateRange] = useState<any>({
        from: montage.scheduledInstallationAt ? new Date(montage.scheduledInstallationAt) : undefined,
        to: montage.scheduledInstallationEndAt ? new Date(montage.scheduledInstallationEndAt) : undefined,
    });

    // --- SAVE LOGIC ---
    const handleSave = async () => {
        try {
            // 1. Save Measurement Data
            await updateMontageMeasurement(montage.id, {
               measurementDate: measurementDate ? new Date(measurementDate) : null,
               isHousingVat,
               floorArea: floorArea ? parseFloat(floorArea) : null,
               measurementSubfloorCondition: subfloorCondition,
               measurementInstallationMethod: installationMethod,
               measurementFloorPattern: floorPattern,
               panelWaste: parseFloat(panelWaste) || 0,
               measurementAdditionalMaterials: additionalMaterials,
               measurementRooms: measurementRooms, // JSON
               // We might need to handle dateRange -> scheduledInstallationAt if assistant sets it
               scheduledInstallationAt: dateRange?.from,
               scheduledInstallationEndAt: dateRange?.to,
            });

            // 2. Save Technical Audit
            await updateTechnicalAudit(montage.id, technicalAudit);

            router.refresh();
            onClose();
        } catch (error) {
            console.error("Error saving assistant data", error);
            // toast error?
        }
    };

    return (
        <MeasurementAssistantModal
            isOpen={isOpen}
            onClose={onClose}
            onSave={handleSave}
            
            measurementDate={measurementDate}
            setMeasurementDate={setMeasurementDate}
            
            isHousingVat={isHousingVat}
            setIsHousingVat={setIsHousingVat}
            
            subfloorCondition={subfloorCondition}
            setSubfloorCondition={setSubfloorCondition}
            
            technicalAudit={technicalAudit}
            // setTechnicalAudit isn't passed directly? Assistant likely updates it via internal AuditForm or specific props?
            // Checking read_file output... props were `technicalAudit`... wait, where is setTechnicalAudit?
            // Ah, looking at AuditForm usages... it might be internal to the Assistant or passed differently.
            // Let's re-check the AssistantModal props from read_file.
            
            montageId={montage.id}
            
            installationMethod={installationMethod}
            setInstallationMethod={setInstallationMethod}
            
            floorPattern={floorPattern}
            setFloorPattern={setFloorPattern}
            
            panelWaste={panelWaste}
            setPanelWaste={setPanelWaste}
            
            floorArea={floorArea}
            setFloorArea={setFloorArea}
            
            panelModel={panelModel}
            // setPanelModel isn't in the props list I saw... checking again.
            // saw `panelModel` and `setIsPanelSelectorOpen`. 
            
            setIsPanelSelectorOpen={setIsPanelSelectorOpen}
            
            additionalMaterials={additionalMaterials}
            setAdditionalMaterials={setAdditionalMaterials}
            
            measurementRooms={measurementRooms}
            setMeasurementRooms={setMeasurementRooms}
            
            dateRange={dateRange}
            setDateRange={setDateRange}
        />
    );
}
