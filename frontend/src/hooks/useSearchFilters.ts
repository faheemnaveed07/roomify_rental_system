/**
 * useSearchFilters
 *
 * URL is the single source of truth for all search / filter state.
 * This hook reads from URLSearchParams and exposes typed helpers to
 * update them. React Router's useSearchParams handles history pushes,
 * so the browser back-button works for free.
 *
 * Encoding rules (mirrors backend propertySearchQuerySchema):
 *  - numbers   → plain string  ("5000")
 *  - booleans  → "true" / "false"
 *  - arrays    → repeated key  (?amenities=wifi&amenities=ac)
 *  - dates     → ISO string    ("2025-06-01")
 *  - undefined → key omitted entirely
 */

import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { IPropertyFilter } from '@shared/types';

export interface ParsedFilters extends IPropertyFilter {
    q?: string;
}

export interface PaginationState {
    page: number;
    limit: number;
    sortBy: string;
    sortOrder: 'asc' | 'desc';
}

export type FiltersWithPagination = ParsedFilters & PaginationState;

// ─── helpers ────────────────────────────────────────────────────────────────

function getStr(params: URLSearchParams, key: string): string | undefined {
    return params.get(key) ?? undefined;
}

function getNum(params: URLSearchParams, key: string): number | undefined {
    const v = params.get(key);
    if (!v) return undefined;
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
}

function getBool(params: URLSearchParams, key: string): boolean | undefined {
    const v = params.get(key);
    if (v === 'true') return true;
    if (v === 'false') return false;
    return undefined;
}

function getArray(params: URLSearchParams, key: string): string[] | undefined {
    const vals = params.getAll(key);
    return vals.length > 0 ? vals : undefined;
}

function getDate(params: URLSearchParams, key: string): Date | undefined {
    const v = params.get(key);
    if (!v) return undefined;
    const d = new Date(v);
    return isNaN(d.getTime()) ? undefined : d;
}

// ─── main hook ───────────────────────────────────────────────────────────────

export function useSearchFilters() {
    const [searchParams, setSearchParams] = useSearchParams();

    /** All current filter + pagination values, parsed from the URL. */
    const filters: FiltersWithPagination = useMemo(() => ({
        q:               getStr(searchParams, 'q'),
        city:            getStr(searchParams, 'city'),
        area:            getStr(searchParams, 'area'),
        propertyType:    getStr(searchParams, 'propertyType') as IPropertyFilter['propertyType'],
        minRent:         getNum(searchParams, 'minRent'),
        maxRent:         getNum(searchParams, 'maxRent'),
        minBedrooms:     getNum(searchParams, 'minBedrooms'),
        maxBedrooms:     getNum(searchParams, 'maxBedrooms'),
        amenities:       getArray(searchParams, 'amenities') as IPropertyFilter['amenities'],
        genderPreference: getStr(searchParams, 'genderPreference') as IPropertyFilter['genderPreference'],
        furnished:       getBool(searchParams, 'furnished'),
        availableFrom:   getDate(searchParams, 'availableFrom'),
        // pagination
        page:      getNum(searchParams, 'page')  ?? 1,
        limit:     getNum(searchParams, 'limit') ?? 10,
        sortBy:    getStr(searchParams, 'sortBy')    ?? 'createdAt',
        sortOrder: (getStr(searchParams, 'sortOrder') ?? 'desc') as 'asc' | 'desc',
    }), [searchParams]);

    /**
     * Merge a partial update into the URL. Always resets page to 1 when
     * a filter key (non-pagination) changes, so stale pages don't show.
     */
    const setFilters = useCallback(
        (updates: Partial<FiltersWithPagination>) => {
            setSearchParams((prev) => {
                const next = new URLSearchParams(prev);

                // Detect if any non-pagination filter changed → reset page
                const paginationKeys = new Set(['page', 'limit', 'sortBy', 'sortOrder']);
                const hasFilterChange = Object.keys(updates).some((k) => !paginationKeys.has(k));
                if (hasFilterChange) next.delete('page');

                for (const [rawKey, value] of Object.entries(updates)) {
                    const key = rawKey as string;

                    if (value === undefined || value === null || value === '') {
                        next.delete(key);
                        continue;
                    }

                    if (Array.isArray(value)) {
                        next.delete(key);
                        if (value.length > 0) {
                            value.forEach((item) => next.append(key, String(item)));
                        }
                        continue;
                    }

                    if (value instanceof Date) {
                        next.set(key, value.toISOString());
                        continue;
                    }

                    next.set(key, String(value));
                }

                return next;
            }, { replace: false });
        },
        [setSearchParams]
    );

    /** Remove a single filter key from the URL. */
    const clearFilter = useCallback(
        (key: keyof FiltersWithPagination) => {
            setSearchParams((prev) => {
                const next = new URLSearchParams(prev);
                next.delete(key as string);
                next.delete('page'); // reset pagination
                return next;
            }, { replace: false });
        },
        [setSearchParams]
    );

    /** Reset all filters and pagination (keeps the URL clean). */
    const clearAll = useCallback(() => {
        setSearchParams(new URLSearchParams(), { replace: false });
    }, [setSearchParams]);

    /**
     * A stable query-key array for React Query.
     * Includes every URL param so any change triggers a refetch.
     */
    const queryKey = useMemo(
        () => ['properties', Object.fromEntries(searchParams.entries())],
        [searchParams]
    );

    return { filters, setFilters, clearFilter, clearAll, queryKey };
}
