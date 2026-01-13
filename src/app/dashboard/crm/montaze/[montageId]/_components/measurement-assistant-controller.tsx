'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DateRange } from 'react-day-picker';
import { toast } from 'sonner';
import type { Montage, MeasurementMaterialItem } from '../../types';
import { type FloorProductState } from '../../types';
import type { TechnicalAuditData } from '../../technical-data';
import { MeasurementAssistantModal } from '../../_components/measurement-assistant-modal';
import { ProductSelectorModal } from '../../_components/product-selector-modal';
import { updateMontageMeasurement, updateMontageStatus } from '../../actions';
import { updateTechnicalAudit } from '../../technical-actions';

interface MeasurementAssistantControllerProps {
    montage: Montage;
    isOpen: boolean;
    onClose: () => void;
    initialStep?: number;
}

export function MeasurementAssistantController({ montage, isOpen, onClose, initialStep = 0 }: MeasurementAssistantControllerProps) {
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
    const [technicalAudit] = useState<TechnicalAuditData>(() => {
        if (montage.technicalAudit) {
            return montage.technicalAudit as unknown as TechnicalAuditData;
        }
        return {
            humidity: null,
            humidityMethod: 'CM',
            flatness: null,
            subfloorType: 'concrete',
            heating: false,
            heatingProtocol: false,
            floorHeated: false,
            photoUrl: '', // Assistant actually uses `photos` array in TechnicalAuditData interface I saw in file
            photos: [],
            notes: ''
        };
    });

    // Multi-Floor Products State
    const [floorProducts, setFloorProducts] = useState<FloorProductState[]>(() => {
        if (montage.floorProducts && montage.floorProducts.length > 0) {
            return montage.floorProducts.map(fp => ({
                id: fp.id || Math.random().toString(36).substring(7),
                productId: fp.productId ?? null,
                name: fp.name,
                area: fp.area,
                waste: fp.waste,
                installationMethod: (fp.installationMethod as 'click' | 'glue') || 'click',
                layingDirection: fp.layingDirection || '',
                rooms: fp.rooms || []
            }));
        }
        
        // Fallback for legacy data
        const legacyArea = montage.floorArea || 0;
        if (legacyArea > 0 || montage.panelModel) {
            return [{
                id: 'legacy-default',
                productId: montage.panelProductId?.toString() || null,
                name: montage.panelModel || '',
                area: legacyArea,
                waste: montage.panelWaste || 5,
                installationMethod: (montage.measurementInstallationMethod as 'click' | 'glue') || 'click',
                layingDirection: montage.measurementLayingDirection || '',
                rooms: montage.measurementRooms || []
            }];
        }
        
        return [];
    });

    const [sketchPhotoUrl, setSketchPhotoUrl] = useState(montage.measurementSketchPhotoUrl || null);
    
    // Panel selection state
    const [isPanelSelectorOpen, setIsPanelSelectorOpen] = useState(false);
    const [editingFloorIndex, setEditingFloorIndex] = useState<number | null>(null);

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
    
    // Assistant needs dateRange prop?
    const [dateRange, setDateRange] = useState<DateRange | undefined>({
        from: montage.scheduledInstallationAt ? new Date(montage.scheduledInstallationAt) : undefined,
        to: montage.scheduledInstallationEndAt ? new Date(montage.scheduledInstallationEndAt) : undefined,
    });

    // --- HELPER FOR OPENING SELECTOR ---
    const handleOpenPanelSelector = (val: boolean, index?: number) => {
        setIsPanelSelectorOpen(val);
        if (val && index !== undefined) {
            setEditingFloorIndex(index);
        } else if (!val) {
            setEditingFloorIndex(null);
        }
    };

    // --- SAVE LOGIC ---
    const handleSave = async () => {
        try {
            // Calculated aggregates for legacy/display fields
            const totalArea = floorProducts.reduce((acc, curr) => acc + (curr.area || 0), 0);
            const mainProduct = floorProducts[0] || {};
            const allRooms = floorProducts.flatMap(fp => fp.rooms);

            // 1. Save Measurement Data
            await updateMontageMeasurement({
               montageId: montage.id,
               measurementDate: measurementDate || null,
               isHousingVat,
               
               // New Data
               floorProducts: floorProducts.map(fp => ({
                   productId: fp.productId,
                   name: fp.name,
                   area: fp.area,
                   waste: fp.waste,
                   installationMethod: fp.installationMethod,
                   layingDirection: fp.layingDirection,
                   rooms: fp.rooms
               })),

               // Legacy / Aggregate fields
               floorArea: totalArea,
               measurementSubfloorCondition: subfloorCondition,
               measurementInstallationMethod: mainProduct.installationMethod || 'click',
               measurementFloorPattern: 'classic', // Legacy field
               measurementLayingDirection: mainProduct.layingDirection || '',
               measurementSketchPhotoUrl: sketchPhotoUrl,
               panelWaste: mainProduct.waste || 5, // Approximate
               measurementAdditionalMaterials: additionalMaterials,
               measurementRooms: allRooms,
               
               scheduledInstallationAt: dateRange?.from ? dateRange.from.getTime() : null,
               scheduledInstallationEndAt: dateRange?.to ? dateRange.to.getTime() : null,
               
               // Required fields that are not in assistant, passing current or defaults
               measurementDetails: montage.measurementDetails || '',
               floorDetails: montage.floorDetails || '',
               panelModel: mainProduct.name || montage.panelModel || '',
               panelProductId: mainProduct.productId || montage.panelProductId, 
               modelsApproved: montage.modelsApproved || false,
               additionalInfo: montage.additionalInfo || '',
               sketchUrl: montage.sketchUrl || null,
               measurementAdditionalWorkNeeded: montage.measurementAdditionalWorkNeeded || false,
               measurementAdditionalWorkDescription: montage.measurementAdditionalWorkDescription || ''
            });

            // 2. Save Technical Audit
            await updateTechnicalAudit(montage.id, technicalAudit);

            // 3. Auto-update status if scheduled
            if (montage.status === 'measurement_scheduled') {
                await updateMontageStatus({ montageId: montage.id, status: 'measurement_done' });
                toast.success("Pomiar zatwierdzony! Przejdź do wyceny.");
            } else {
                toast.success("Dane pomiarowe zaktualizowane");
            }

            router.refresh();
            onClose();
        } catch (error) {
            console.error("Error saving assistant data", error);
            toast.error("Błąd zapisu danych pomiarowych");
        }
    };

    return (
        <>
        <MeasurementAssistantModal
            key={isOpen ? "open" : "closed"}
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
            montageId={montage.id}
            
            // Floor Products
            floorProducts={floorProducts}
            setFloorProducts={setFloorProducts}

            // Legacy/Dummy Props to satisfy Modal Interface (though Modal ignores them in Case 3)
            installationMethod={'click'} 
            setInstallationMethod={() => {}}
            floorPattern={'classic'}
            setFloorPattern={() => {}}
            layingDirection={''}
            setLayingDirection={() => {}}
            panelWaste={'5'}
            setPanelWaste={() => {}}
            floorArea={floorProducts.reduce((acc, curr) => acc + curr.area, 0).toString()}
            setFloorArea={() => {}}
            panelModel={''}
            // setPanelModel isn't passed
            setIsPanelSelectorOpen={handleOpenPanelSelector}
            
            measurementRooms={[]} // We use per-model rooms
            setMeasurementRooms={() => {}}

            sketchPhotoUrl={sketchPhotoUrl}
            setSketchPhotoUrl={setSketchPhotoUrl}
            
            additionalMaterials={additionalMaterials}
            setAdditionalMaterials={setAdditionalMaterials}
            
            dateRange={dateRange}
            setDateRange={setDateRange}
            
            initialStep={initialStep}
        />
        
        <ProductSelectorModal 
            isOpen={isPanelSelectorOpen}
            onClose={() => setIsPanelSelectorOpen(false)}
            type="panel"
            onSelect={(product) => {
                if (editingFloorIndex !== null && floorProducts[editingFloorIndex]) {
                    const newProducts = [...floorProducts];
                    newProducts[editingFloorIndex] = {
                        ...newProducts[editingFloorIndex],
                        productId: String(product.id),
                        name: product.name,
                    };
                    setFloorProducts(newProducts);
                }
                setIsPanelSelectorOpen(false);
                setEditingFloorIndex(null);
            }}
        />
        </>
    );
}
