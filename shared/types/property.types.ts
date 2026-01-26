export enum PropertyType {
    SHARED_ROOM = 'shared_room',
    FULL_HOUSE = 'full_house',
}

export enum PropertyStatus {
    PENDING_VERIFICATION = 'pending_verification',
    ACTIVE = 'active',
    RENTED = 'rented',
    INACTIVE = 'inactive',
    REJECTED = 'rejected',
}

export enum Amenity {
    WIFI = 'wifi',
    AC = 'ac',
    HEATING = 'heating',
    PARKING = 'parking',
    LAUNDRY = 'laundry',
    GYM = 'gym',
    POOL = 'pool',
    SECURITY = 'security',
    CCTV = 'cctv',
    GENERATOR = 'generator',
    WATER_TANK = 'water_tank',
    ELEVATOR = 'elevator',
    BALCONY = 'balcony',
    GARDEN = 'garden',
    ROOFTOP = 'rooftop',
    SERVANT_QUARTER = 'servant_quarter',
    CABLE_TV = 'cable_tv',
    INTERCOM = 'intercom',
}

export interface ILocation {
    type: 'Point';
    coordinates: [number, number];
    address: string;
    city: string;
    area: string;
    postalCode?: string;
}

export interface IRent {
    amount: number;
    currency: string;
    paymentFrequency: 'monthly' | 'quarterly' | 'yearly';
    securityDeposit: number;
}

export interface ISize {
    value: number;
    unit: 'sqft' | 'sqm' | 'marla' | 'kanal';
}

export interface IPropertyImage {
    url: string;
    publicId: string;
    isPrimary: boolean;
}

export interface ISharedRoomDetails {
    totalBeds: number;
    availableBeds: number;
    currentOccupants: number;
    genderPreference: 'male' | 'female' | 'any';
    occupantDetails?: {
        name: string;
        age: number;
        occupation: string;
    }[];
}

export interface IFullHouseDetails {
    bedrooms: number;
    bathrooms: number;
    floors: number;
    parkingSpaces: number;
    furnishingStatus: 'furnished' | 'semi-furnished' | 'unfurnished';
}

export interface IPropertyRules {
    petsAllowed: boolean;
    smokingAllowed: boolean;
    visitorsAllowed: boolean;
    additionalRules?: string[];
}

export interface IPropertyAvailability {
    isAvailable: boolean;
    availableFrom: Date;
    minimumStay: number;
}

export interface IVerificationStatus {
    ownershipVerified: boolean;
    documentsUploaded: boolean;
    adminApproved: boolean;
    verifiedAt?: Date;
    verifiedBy?: string;
}

export interface IProperty {
    _id?: string;
    owner: string;
    title: string;
    description: string;
    propertyType: PropertyType;
    status: PropertyStatus;
    location: ILocation;
    rent: IRent;
    size: ISize;
    images: IPropertyImage[];
    amenities: Amenity[];
    sharedRoomDetails?: ISharedRoomDetails;
    fullHouseDetails?: IFullHouseDetails;
    rules: IPropertyRules;
    availability: IPropertyAvailability;
    views: number;
    inquiries: number;
    verificationStatus: IVerificationStatus;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface IPropertyCreate {
    title: string;
    description: string;
    propertyType: PropertyType;
    location: Omit<ILocation, 'type'>;
    rent: Omit<IRent, 'currency'> & { currency?: string };
    size: ISize;
    amenities?: Amenity[];
    sharedRoomDetails?: ISharedRoomDetails;
    fullHouseDetails?: IFullHouseDetails;
    rules?: Partial<IPropertyRules>;
    availability?: Partial<IPropertyAvailability>;
}

export interface IPropertyUpdate {
    title?: string;
    description?: string;
    rent?: Partial<IRent>;
    amenities?: Amenity[];
    sharedRoomDetails?: Partial<ISharedRoomDetails>;
    fullHouseDetails?: Partial<IFullHouseDetails>;
    rules?: Partial<IPropertyRules>;
    availability?: Partial<IPropertyAvailability>;
}

export interface IPropertyFilter {
    city?: string;
    area?: string;
    propertyType?: PropertyType;
    minRent?: number;
    maxRent?: number;
    minBedrooms?: number;
    maxBedrooms?: number;
    amenities?: Amenity[];
    genderPreference?: 'male' | 'female' | 'any';
    availableFrom?: Date;
    furnished?: boolean;
    nearLocation?: {
        longitude: number;
        latitude: number;
        maxDistanceKm: number;
    };
}

export interface IPropertySearchResult {
    properties: IProperty[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}
