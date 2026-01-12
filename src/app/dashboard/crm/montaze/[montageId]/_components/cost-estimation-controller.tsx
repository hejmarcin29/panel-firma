'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { Montage, MeasurementMaterialItem } from '../types';
import { CostEstimationModal } from './_components/cost-estimation-modal';
import { updateMontageCostEstimation } from './actions';
import { getEstimatedBaseService } from './actions-services';

interface CostEstimationControllerProps {
    montage: Montage;
    isOpen: boolean;
    onClose: () => void;
}

export function CostEstimationController({ montage, isOpen, onClose }: CostEstimationControllerProps) {
    const router = useRouter();

    const [additionalWorkDescription, setAdditionalWorkDescription] = useState(montage.measurementAdditionalWorkDescription || '');
    
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

    // Base Service Logic
    const [baseServicePrice, setBaseServicePrice] = useState(0);
    const [baseServiceName, setBaseServiceName] = useState('');

    useEffect(() => {
        if (isOpen) {
            const fetchPrice = async () => {
                try {
                    const method = (montage.measurementInstallationMethod as 'click' | 'glue') || 'click';
                    const pattern = (montage.measurementFloorPattern as 'classic' | 'herringbone') || 'classic';
                    
                    const service = await getEstimatedBaseService(
                        method,
                        pattern,
                        montage.id
                    );
                    if (service) {
                        setBaseServicePrice(service.basePriceNet || 0);
                        setBaseServiceName(service.name);
                    }
                } catch (e) {
                    console.error("Failed to fetch base service price", e);
                }
            };
            fetchPrice();
        }
    }, [isOpen, montage.id, montage.measurementInstallationMethod, montage.measurementFloorPattern]);


    const handleSave = async (completed: boolean) => {
        try {
           await updateMontageCostEstimation(montage.id, {
                costEstimationAdditionalWorkDescription: additionalWorkDescription,
                costEstimationAdditionalMaterials: additionalMaterials, // If modified
                costEstimationServices: additionalServices,
                costEstimationCompleted: completed
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
            setAdditionalWorkDescription={setAdditionalWorkDescription}
            
            baseService={{
                name: baseServiceName,
                quantity: montage.floorArea ? parseFloat(montage.floorArea.toString()) : 0,
                unit: 'm2',
                price: baseServicePrice
            }}
            
            additionalMaterials={additionalMaterials}
            setAdditionalMaterials={setAdditionalMaterials}
            
            additionalServices={additionalServices}
            setAdditionalServices={setAdditionalServices}
        />
    );
}
