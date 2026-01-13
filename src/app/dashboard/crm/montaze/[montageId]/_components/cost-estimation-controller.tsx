'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { Montage, MeasurementMaterialItem } from '../../types';
import { CostEstimationModal } from '../../_components/cost-estimation-modal';
import { updateMontageCostEstimation } from '../../actions';
import { getEstimatedBaseService } from '../../actions-services';

interface CostEstimationControllerProps {
    montage: Montage;
    isOpen: boolean;
    onClose: () => void;
}

export function CostEstimationController({ montage, isOpen, onClose }: CostEstimationControllerProps) {
    const router = useRouter();

    const [additionalWorkDescription] = useState(montage.measurementAdditionalWorkDescription || '');
    
    // Additional Materials - reused from measurement or specific for cost?
    // In original tab: const [additionalMaterials, setAdditionalMaterials] = useState...
    // Only used here if we want to modify materials during cost estimation.
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

    // Additional Services
    const [additionalServices, setAdditionalServices] = useState<{ id: string; name: string; quantity: number; unit: string; price: number }[]>([]);

    // Base Service Logic - Multi-Product Support
    const [baseServices, setBaseServices] = useState<{ serviceId?: string; name: string; quantity: number; unit: string; price: number; method: string; pattern: string }[]>([]);

    useEffect(() => {
        if (isOpen) {
            const fetchPrices = async () => {
                try {
                    const servicesList = [];
                    
                    // CASE A: Multi-Product (New)
                    if (montage.floorProducts && montage.floorProducts.length > 0) {
                         for (const product of montage.floorProducts) {
                            const method = product.installationMethod || 'click';
                            const globalPattern = (montage.measurementFloorPattern as 'classic' | 'herringbone') || 'classic';
                            
                            const service = await getEstimatedBaseService(method, globalPattern, montage.id);
                            
                            servicesList.push({
                                serviceId: service?.id,
                                name: `${service?.name || 'Montaż'} - ${product.name}`,
                                quantity: product.area,
                                unit: 'm²',
                                price: service?.basePriceNet || 0,
                                method,
                                pattern: globalPattern
                            });
                         }
                    } 
                    // CASE B: Legacy
                    else {
                        const method = (montage.measurementInstallationMethod as 'click' | 'glue') || 'click';
                        const pattern = (montage.measurementFloorPattern as 'classic' | 'herringbone') || 'classic';
                        
                        const service = await getEstimatedBaseService(method, pattern, montage.id);
                        
                        servicesList.push({
                            serviceId: service?.id,
                            name: service?.name || 'Montaż',
                            quantity: montage.floorArea ? parseFloat(montage.floorArea.toString()) : 0,
                            unit: 'm²',
                            price: service?.basePriceNet || 0,
                            method,
                            pattern
                        });
                    }
                    
                    setBaseServices(servicesList);

                } catch (e) {
                    console.error("Failed to fetch base service prices", e);
                }
            };
            fetchPrices();
        }
    }, [isOpen, montage.id, montage.measurementInstallationMethod, montage.measurementFloorPattern, montage.floorProducts, montage.floorArea]);


    const handleSave = async (completed: boolean | undefined) => {
        try {
           await updateMontageCostEstimation({
                montageId: montage.id,
                measurementAdditionalMaterials: additionalMaterials, 
                additionalServices: additionalServices,
                baseServices: baseServices,
                completed: completed ?? false
           });
           router.refresh();
           onClose();
        } catch (error) {
            console.error("Failed to save cost estimation", error);
        }
    };

    const measurementDate = montage.measurementDate 
        ? new Date(montage.measurementDate as string | number | Date).toISOString().slice(0, 16)
        : "";

    return (
        <CostEstimationModal
            isOpen={isOpen}
            onClose={onClose}
            onSave={handleSave}
            
            measurementDate={measurementDate} // Just for display
            
            additionalWorkDescription={additionalWorkDescription}
            
            baseServices={baseServices}
            
            additionalMaterials={additionalMaterials}
            setAdditionalMaterials={setAdditionalMaterials}
            
            additionalServices={additionalServices}
            setAdditionalServices={setAdditionalServices}
        />
    );
}
