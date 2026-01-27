import React, { useState, useCallback } from 'react';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
    Building2,
    Home,
    MapPin,
    DollarSign,
    Bed,
    Plus,
    X,
    Upload,
    Loader2
} from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { PropertyType, Amenity, IPropertyImage, IPropertyCreate } from '@shared/types';
import { propertyService } from '../../services/api';
import { useLocalUpload } from '../../hooks/useLocalUpload';
import { useAuthStore } from '../../store/auth.store';
import Button from '../atoms/Button';
import Input from '../atoms/Input';

// Validation Schema
const propertySchema = z.object({
    title: z.string().min(10, 'Title must be at least 10 characters'),
    description: z.string().min(20, 'Description must be at least 20 characters'),
    propertyType: z.nativeEnum(PropertyType),
    rent: z.object({
        amount: z.number().min(1000, 'Rent must be at least 1,000 PKR'),
        securityDeposit: z.number().min(0),
    }),
    location: z.object({
        address: z.string().min(5, 'Address is required'),
        city: z.enum(['Multan', 'Vehari']),
        area: z.string().min(2, 'Area is required'),
    }),
    size: z.object({
        value: z.number().positive('Size must be positive'),
        unit: z.enum(['sqft', 'sqm', 'marla', 'kanal']),
    }),
    sharedRoomDetails: z.object({
        totalBeds: z.number().int().positive(),
        genderPreference: z.enum(['male', 'female', 'any']),
    }).optional(),
    fullHouseDetails: z.object({
        bedrooms: z.number().int().positive(),
        bathrooms: z.number().int().positive(),
    }).optional(),
    amenities: z.array(z.nativeEnum(Amenity)),
});

type PropertyFormData = z.infer<typeof propertySchema>;

interface PropertyUploadFormProps {
    onSuccess: () => void;
}

const PropertyUploadForm: React.FC<PropertyUploadFormProps> = ({ onSuccess }) => {
    const { user } = useAuthStore();
    const { uploadImages, uploading: isUploadingMedia } = useLocalUpload();
    const [images, setImages] = useState<IPropertyImage[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

    const {
        control,
        handleSubmit,
        watch,
        setValue,
        formState: { errors },
    } = useForm<PropertyFormData>({
        resolver: zodResolver(propertySchema),
        defaultValues: {
            title: '',
            description: '',
            propertyType: PropertyType.FULL_HOUSE,
            rent: { amount: 0, securityDeposit: 0 },
            location: { address: '', city: 'Multan', area: '' },
            size: { value: 0, unit: 'marla' },
            amenities: [],
        },
    });

    const propertyType = watch('propertyType');

    // Drag & Drop Handler
    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        try {
            const uploaded = await uploadImages(acceptedFiles);
            setImages((prev: IPropertyImage[]) => [...prev, ...uploaded]);
        } catch (err: any) {
            setError(err.message);
        }
    }, [uploadImages]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'image/*': [] },
        maxFiles: 10
    });

    const removeImage = (publicId: string) => {
        setImages((prev: IPropertyImage[]) => prev.filter((img: IPropertyImage) => img.publicId !== publicId));
    };

    const onSubmit = async (data: PropertyFormData) => {
        if (images.length === 0) {
            setError('At least one image is required');
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            // Transform form data to match API expectations (IPropertyCreate)
            const payload: IPropertyCreate = {
                title: data.title,
                description: data.description,
                propertyType: data.propertyType,
                images,
                location: {
                    address: data.location.address,
                    city: data.location.city,
                    area: data.location.area,
                    coordinates: [71.5249, 30.1575], // Defaults for Multan
                },
                rent: {
                    amount: data.rent.amount,
                    securityDeposit: data.rent.securityDeposit,
                    currency: 'PKR',
                    paymentFrequency: 'monthly',
                },
                size: {
                    value: data.size.value,
                    unit: data.size.unit as any, // Cast to match expected literal types
                },
                amenities: data.amenities,
                // Add defaults for missing required fields in ISharedRoomDetails/IFullHouseDetails
                ...(data.propertyType === PropertyType.SHARED_ROOM && data.sharedRoomDetails ? {
                    sharedRoomDetails: {
                        ...data.sharedRoomDetails,
                        availableBeds: data.sharedRoomDetails.totalBeds,
                        currentOccupants: 0,
                    }
                } : {}),
                ...(data.propertyType === PropertyType.FULL_HOUSE && data.fullHouseDetails ? {
                    fullHouseDetails: {
                        ...data.fullHouseDetails,
                        floors: 1,
                        parkingSpaces: 0,
                        furnishingStatus: 'unfurnished',
                    }
                } : {}),
            };

            await propertyService.create({
                ...payload,
                owner: user?.id || ''
            });
            onSuccess();
        } catch (err: any) {
            setError(err.message || 'Failed to create property');
        } finally {
            setIsSubmitting(false);
        }
    };

    const onFormSubmit: SubmitHandler<PropertyFormData> = (data) => onSubmit(data);

    return (
        <form onSubmit={handleSubmit(onFormSubmit)} className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            {/* Left Column: Data Entry */}
            <div className="space-y-8">
                <section className="space-y-6">
                    <div className="flex items-center gap-3 pb-2 border-b border-neutral-100">
                        <div className="p-2 bg-blue-50 text-[#2563EB] rounded-lg">
                            <Building2 size={20} />
                        </div>
                        <h3 className="text-lg font-bold text-slate-800">Basic Information</h3>
                    </div>

                    <Controller
                        name="title"
                        control={control}
                        render={({ field }) => (
                            <Input
                                {...field}
                                label="Property Title"
                                placeholder="e.g. Spacious 3 Marla House near Metro"
                                error={errors.title?.message}
                            />
                        )}
                    />

                    <Controller
                        name="description"
                        control={control}
                        render={({ field }) => (
                            <div className="flex flex-col gap-1">
                                <label className="text-sm font-medium text-neutral-700">Description</label>
                                <textarea
                                    {...field}
                                    rows={4}
                                    placeholder="Describe your property in detail..."
                                    className={`p-3 border rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all ${errors.description ? 'border-red-500 bg-red-50' : 'border-neutral-200'
                                        }`}
                                />
                                {errors.description && <p className="text-xs text-red-500">{errors.description.message}</p>}
                            </div>
                        )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                        <Controller
                            name="propertyType"
                            control={control}
                            render={({ field }) => (
                                <div className="flex flex-col gap-1">
                                    <label className="text-sm font-medium text-neutral-700">Property Type</label>
                                    <select
                                        {...field}
                                        className="p-2.5 border border-neutral-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                                    >
                                        <option value={PropertyType.FULL_HOUSE}>Full House</option>
                                        <option value={PropertyType.SHARED_ROOM}>Shared Room</option>
                                    </select>
                                </div>
                            )}
                        />

                        <div className="flex flex-col gap-1">
                            <label className="text-sm font-medium text-neutral-700">Size Unit</label>
                            <select
                                onChange={(e) => setValue('size.unit', e.target.value as any)}
                                className="p-2.5 border border-neutral-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                            >
                                <option value="marla">Marla</option>
                                <option value="sqft">Sq Ft</option>
                                <option value="kanal">Kanal</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <Controller
                            name="size.value"
                            control={control}
                            render={({ field }) => (
                                <Input
                                    {...field}
                                    type="number"
                                    label="Area Value"
                                    placeholder="5"
                                    onChange={(e) => field.onChange(Number(e.target.value))}
                                    error={errors.size?.value?.message}
                                />
                            )}
                        />
                        <Controller
                            name="rent.amount"
                            control={control}
                            render={({ field }) => (
                                <Input
                                    {...field}
                                    type="number"
                                    label="Monthly Rent (PKR)"
                                    placeholder="15,000"
                                    leftIcon={<DollarSign size={16} />}
                                    onChange={(e) => field.onChange(Number(e.target.value))}
                                    error={errors.rent?.amount?.message}
                                />
                            )}
                        />
                    </div>
                </section>

                {/* Conditional Sections */}
                {propertyType === PropertyType.SHARED_ROOM ? (
                    <section className="space-y-6 p-6 bg-blue-50/50 rounded-3xl border border-blue-100 animate-in fade-in duration-300">
                        <div className="flex items-center gap-3">
                            <Bed className="text-[#2563EB]" size={20} />
                            <h3 className="font-bold text-slate-800">Shared Room Details</h3>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <Controller
                                name="sharedRoomDetails.totalBeds"
                                control={control}
                                render={({ field }) => (
                                    <Input
                                        {...field}
                                        type="number"
                                        label="Total Beds"
                                        placeholder="2"
                                        onChange={(e) => field.onChange(Number(e.target.value))}
                                    />
                                )}
                            />
                            <Controller
                                name="sharedRoomDetails.genderPreference"
                                control={control}
                                render={({ field }) => (
                                    <div className="flex flex-col gap-1">
                                        <label className="text-sm font-medium text-neutral-700">Gender Only</label>
                                        <select
                                            {...field}
                                            className="p-2.5 border border-neutral-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                                        >
                                            <option value="any">Any</option>
                                            <option value="male">Male</option>
                                            <option value="female">Female</option>
                                        </select>
                                    </div>
                                )}
                            />
                        </div>
                    </section>
                ) : (
                    <section className="space-y-6 animate-in fade-in duration-300">
                        <div className="flex items-center gap-3">
                            <Home className="text-[#2563EB]" size={20} />
                            <h3 className="font-bold text-slate-800">House Configuration</h3>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <Controller
                                name="fullHouseDetails.bedrooms"
                                control={control}
                                render={({ field }) => (
                                    <Input
                                        {...field}
                                        type="number"
                                        label="Bedrooms"
                                        placeholder="3"
                                        onChange={(e) => field.onChange(Number(e.target.value))}
                                    />
                                )}
                            />
                            <Controller
                                name="fullHouseDetails.bathrooms"
                                control={control}
                                render={({ field }) => (
                                    <Input
                                        {...field}
                                        type="number"
                                        label="Bathrooms"
                                        placeholder="2"
                                        onChange={(e) => field.onChange(Number(e.target.value))}
                                    />
                                )}
                            />
                        </div>
                    </section>
                )}

                <section className="space-y-6">
                    <div className="flex items-center gap-3 pb-2 border-b border-neutral-100">
                        <div className="p-2 bg-blue-50 text-[#2563EB] rounded-lg">
                            <MapPin size={20} />
                        </div>
                        <h3 className="text-lg font-bold text-slate-800">Location</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <Controller
                            name="location.city"
                            control={control}
                            render={({ field }) => (
                                <div className="flex flex-col gap-1">
                                    <label className="text-sm font-medium text-neutral-700">City</label>
                                    <select
                                        {...field}
                                        className="p-2.5 border border-neutral-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                                    >
                                        <option value="Multan">Multan</option>
                                        <option value="Vehari">Vehari</option>
                                    </select>
                                </div>
                            )}
                        />
                        <Controller
                            name="location.area"
                            control={control}
                            render={({ field }) => (
                                <Input {...field} label="Area/Society" placeholder="e.g. Model Town" error={errors.location?.area?.message} />
                            )}
                        />
                    </div>
                    <Controller
                        name="location.address"
                        control={control}
                        render={({ field }) => (
                            <Input {...field} label="Full Address" placeholder="Street number, House number..." error={errors.location?.address?.message} />
                        )}
                    />
                </section>
            </div>

            {/* Right Column: Image Upload & Preview */}
            <div className="space-y-8">
                <section className="space-y-6">
                    <div className="flex items-center gap-3 pb-2 border-b border-neutral-100">
                        <div className="p-2 bg-blue-50 text-[#2563EB] rounded-lg">
                            <Upload size={20} />
                        </div>
                        <h3 className="text-lg font-bold text-slate-800">Property Media</h3>
                    </div>

                    <div
                        {...getRootProps()}
                        className={`border-3 border-dashed rounded-3xl p-12 flex flex-col items-center text-center gap-4 transition-all cursor-pointer ${isDragActive ? 'border-[#2563EB] bg-blue-50' : 'border-neutral-200 hover:border-[#2563EB] hover:bg-neutral-50'
                            }`}
                    >
                        <input {...getInputProps()} />
                        <div className="h-16 w-16 bg-blue-50 text-[#2563EB] rounded-2xl flex items-center justify-center">
                            {isUploadingMedia ? <Loader2 className="animate-spin" size={32} /> : <Plus size={32} />}
                        </div>
                        <div>
                            <p className="font-bold text-slate-800 text-lg">Click or drag images here</p>
                            <p className="text-neutral-500 text-sm mt-1">Upload up to 10 high-quality images of your property.</p>
                        </div>
                    </div>

                    {images.length > 0 && (
                        <div className="grid grid-cols-3 gap-4 animate-in fade-in duration-500">
                            {images.map((img: IPropertyImage) => (
                                <div key={img.publicId} className="group relative aspect-square rounded-2xl overflow-hidden shadow-sm border border-neutral-100">
                                    <img
                                        src={img.url.startsWith('http') ? img.url : `${backendUrl}${img.url}`}
                                        alt="preview"
                                        className="w-full h-full object-cover"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => removeImage(img.publicId)}
                                        className="absolute top-2 right-2 p-1.5 bg-white/90 text-red-500 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                <div className="p-8 bg-neutral-900 rounded-3xl text-white space-y-6 shadow-xl relative overflow-hidden">
                    <div className="relative z-10 space-y-4">
                        <h4 className="text-xl font-black">Publish Selection</h4>
                        <p className="text-neutral-400 text-sm leading-relaxed">
                            By clicking Publish, your property will be sent for admin verification.
                            Our team typically reviews listings within 24 hours.
                        </p>

                        {error && (
                            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs font-medium">
                                {error}
                            </div>
                        )}

                        <Button
                            type="submit"
                            fullWidth
                            isLoading={isSubmitting}
                            disabled={isUploadingMedia}
                            className="bg-[#2563EB] py-4 rounded-2xl font-black text-lg shadow-lg shadow-blue-500/20"
                        >
                            Publish Property
                        </Button>
                    </div>

                    {/* Aesthetic background design element */}
                    <div className="absolute top-0 right-0 h-32 w-32 bg-blue-600/10 blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                </div>
            </div>
        </form>
    );
};

export default PropertyUploadForm;
