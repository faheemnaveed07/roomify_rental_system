import { Request, Response, NextFunction } from 'express';
import { propertyService } from '../services/PropertyService';
import { propertyCreateSchema, paginationSchema, propertySearchQuerySchema } from '../utils/validators';
import { IPropertyFilter, IPropertyCreate } from '@shared/types/property.types';
import { ApiResponse } from '@shared/types/api.types';

export class PropertyController {
    async create(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                res.status(401).json({ success: false, message: 'Unauthorized' });
                return;
            }

            // ✅ FIXED: Cast the entire parsed result to IPropertyCreate
            const validatedData = propertyCreateSchema.parse(req.body) as IPropertyCreate;

            const property = await propertyService.create(userId, validatedData);

            const response: ApiResponse = {
                success: true,
                message: 'Property created successfully. Pending verification.',
                data: property,
            };

            res.status(201).json(response);
        } catch (error) {
            next(error);
        }
    }

    // ... rest of the file remains exactly the same ...
    async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { id } = req.params;
            const property = await propertyService.getById(id);

            if (!property) {
                res.status(404).json({
                    success: false,
                    message: 'Property not found',
                });
                return;
            }

            const response: ApiResponse = {
                success: true,
                message: 'Property retrieved successfully',
                data: property,
            };

            res.json(response);
        } catch (error) {
            next(error);
        }
    }

    async update(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = req.user?.userId;
            const { id } = req.params;

            if (!userId) {
                res.status(401).json({ success: false, message: 'Unauthorized' });
                return;
            }

            const property = await propertyService.update(id, userId, req.body);

            if (!property) {
                res.status(404).json({
                    success: false,
                    message: 'Property not found or you do not have permission',
                });
                return;
            }

            const response: ApiResponse = {
                success: true,
                message: 'Property updated successfully',
                data: property,
            };

            res.json(response);
        } catch (error) {
            next(error);
        }
    }

    async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = req.user?.userId;
            const { id } = req.params;

            if (!userId) {
                res.status(401).json({ success: false, message: 'Unauthorized' });
                return;
            }

            const deleted = await propertyService.delete(id, userId);

            if (!deleted) {
                res.status(404).json({
                    success: false,
                    message: 'Property not found or you do not have permission',
                });
                return;
            }

            const response: ApiResponse = {
                success: true,
                message: 'Property deleted successfully',
            };

            res.json(response);
        } catch (error) {
            next(error);
        }
    }

    async search(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            // Validate and sanitize all search params in one pass.
            // propertySearchQuerySchema handles NaN coercion, regex sanitization,
            // array normalization (amenities), and boolean coercion.
            const filterParsed = propertySearchQuerySchema.safeParse(req.query);
            if (!filterParsed.success) {
                res.status(400).json({
                    success: false,
                    message: 'Invalid search parameters',
                    errors: filterParsed.error.flatten().fieldErrors,
                });
                return;
            }

            // Pagination (sortBy is whitelisted via z.enum — no sort-injection risk)
            const pagination = paginationSchema.parse(req.query);

            const {
                q, city, area, propertyType,
                minRent, maxRent, minBedrooms, maxBedrooms,
                amenities, genderPreference, furnished, availableFrom,
                lat, lng, radius,
            } = filterParsed.data;

            const filters: IPropertyFilter = {
                q,
                city,
                area,
                propertyType: propertyType as IPropertyFilter['propertyType'],
                minRent,
                maxRent,
                minBedrooms,
                maxBedrooms,
                amenities: amenities as IPropertyFilter['amenities'],
                genderPreference,
                furnished,
                availableFrom,
            };

            // Geo-spatial: lat+lng are validated together by the schema refine rule
            if (lat != null && lng != null) {
                filters.nearLocation = {
                    latitude: lat,
                    longitude: lng,
                    maxDistanceKm: radius ?? 10,
                };
            }

            const result = await propertyService.search(filters, pagination);

            const response: ApiResponse = {
                success: true,
                message: 'Properties retrieved successfully',
                data: result.properties,
                meta: {
                    page: result.page,
                    limit: result.limit,
                    total: result.total,
                    totalPages: result.totalPages,
                    hasNextPage: result.page < result.totalPages,
                    hasPrevPage: result.page > 1,
                },
            };

            res.json(response);
        } catch (error) {
            next(error);
        }
    }

    async getMyProperties(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                res.status(401).json({ success: false, message: 'Unauthorized' });
                return;
            }

            const pagination = paginationSchema.parse(req.query);
            const result = await propertyService.getByOwner(userId, pagination);

            const response: ApiResponse = {
                success: true,
                message: 'Your properties retrieved successfully',
                data: result.properties,
                meta: {
                    page: result.page,
                    limit: result.limit,
                    total: result.total,
                    totalPages: result.totalPages,
                    hasNextPage: result.page < result.totalPages,
                    hasPrevPage: result.page > 1,
                },
            };

            res.json(response);
        } catch (error) {
            next(error);
        }
    }

    async getFeatured(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const limit = req.query.limit ? Number(req.query.limit) : 6;
            const properties = await propertyService.getFeatured(limit);

            const response: ApiResponse = {
                success: true,
                message: 'Featured properties retrieved successfully',
                data: properties,
            };

            res.json(response);
        } catch (error) {
            next(error);
        }
    }

    async getNearby(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { lat, lng, radius = '10', limit = '10' } = req.query;

            if (!lat || !lng) {
                res.status(400).json({
                    success: false,
                    message: 'Latitude and longitude are required',
                });
                return;
            }

            const properties = await propertyService.findNearby(
                Number(lng),
                Number(lat),
                Number(radius),
                Number(limit)
            );

            const response: ApiResponse = {
                success: true,
                message: 'Nearby properties retrieved successfully',
                data: properties,
            };

            res.json(response);
        } catch (error) {
            next(error);
        }
    }
}

export const propertyController = new PropertyController();
export default propertyController;