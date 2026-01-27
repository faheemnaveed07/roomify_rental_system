import { create } from 'zustand';
import { IProperty, IPropertyFilter, PaginationQuery } from '@shared/types';
import { propertyService } from '../services/api';

interface PropertyState {
    properties: IProperty[];
    total: number;
    page: number;
    totalPages: number;
    loading: boolean;
    error: string | null;
    filters: IPropertyFilter;
    fetchProperties: (filters?: IPropertyFilter, pagination?: PaginationQuery) => Promise<void>;
    setFilters: (filters: Partial<IPropertyFilter>) => void;
    clearFilters: () => void;
}

export const usePropertyStore = create<PropertyState>((set, get) => ({
    properties: [],
    total: 0,
    page: 1,
    totalPages: 1,
    loading: false,
    error: null,
    filters: {
        city: '',
    },
    fetchProperties: async (newFilters, pagination) => {
        const currentFilters = { ...get().filters, ...newFilters };

        // Transform 'all' values to undefined
        const sanitizedFilters = Object.entries(currentFilters).reduce((acc, [key, value]) => {
            return {
                ...acc,
                [key]: value === 'all' ? undefined : value
            };
        }, {} as IPropertyFilter);

        set({ loading: true, error: null });
        try {
            const result = await propertyService.getProperties(sanitizedFilters, pagination);
            set({
                properties: result.properties,
                total: result.total,
                page: result.page,
                totalPages: result.totalPages,
                loading: false,
                filters: currentFilters,
            });
        } catch (error: any) {
            set({ error: error.message, loading: false });
        }
    },
    setFilters: (newFilters) => {
        set((state) => ({
            filters: { ...state.filters, ...newFilters },
        }));
    },
    clearFilters: () => {
        set({
            filters: { city: '' },
        });
    },
}));
