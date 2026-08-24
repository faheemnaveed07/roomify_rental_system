import React, { useEffect, useRef, useState } from 'react';
import { Camera, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { authService, resolveAssetUrl } from '../../services/api';
import { useAuthStore } from '../../store/auth.store';

const ACCEPTED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_SIZE = 5 * 1024 * 1024; // matches the backend multer limit

interface AvatarUploadProps {
    /** Diameter in px */
    size?: number;
    /** Tailwind radius class — TopBar uses rounded-xl, everywhere else circles */
    rounded?: string;
    /** Show a "Remove photo" action under the avatar (dropdown/profile use) */
    showRemove?: boolean;
    className?: string;
}

/**
 * The user's avatar, clickable to upload a new profile photo.
 * Falls back to gradient initials when no photo is set (or the stored
 * file is gone — uploads on the free host don't survive a rebuild).
 */
const AvatarUpload: React.FC<AvatarUploadProps> = ({
    size = 40,
    rounded = 'rounded-full',
    showRemove = false,
    className = '',
}) => {
    const { user, setAvatar } = useAuthStore();
    const inputRef = useRef<HTMLInputElement>(null);
    const [busy, setBusy] = useState(false);
    const [imgFailed, setImgFailed] = useState(false);

    const avatarUrl = user?.avatar ? resolveAssetUrl(user.avatar) : '';

    useEffect(() => {
        setImgFailed(false);
    }, [user?.avatar]);

    const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.target.value = ''; // allow re-picking the same file
        if (!file) return;

        if (!ACCEPTED_TYPES.includes(file.type)) {
            toast.error('Please choose a JPG, PNG, or WebP image.');
            return;
        }
        if (file.size > MAX_SIZE) {
            toast.error('Image must be 5MB or smaller.');
            return;
        }

        setBusy(true);
        try {
            const path = await authService.updateAvatar(file);
            setAvatar(path);
            toast.success('Profile photo updated');
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Could not upload the photo.');
        } finally {
            setBusy(false);
        }
    };

    const handleRemove = async () => {
        setBusy(true);
        try {
            await authService.removeAvatar();
            setAvatar(null);
            toast.success('Profile photo removed');
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Could not remove the photo.');
        } finally {
            setBusy(false);
        }
    };

    const iconSize = Math.max(14, Math.round(size * 0.38));
    const initials =
        `${user?.firstName?.[0] ?? 'U'}${user?.lastName?.[0] ?? ''}`.toUpperCase();

    return (
        <div className={`flex flex-col items-center gap-1.5 ${className}`}>
            <button
                type="button"
                onClick={() => !busy && inputRef.current?.click()}
                title="Change profile photo"
                aria-label="Change profile photo"
                className={`group relative shrink-0 overflow-hidden ${rounded} shadow-sm`}
                style={{ width: size, height: size }}
            >
                {avatarUrl && !imgFailed ? (
                    <img
                        src={avatarUrl}
                        alt="Profile"
                        className="h-full w-full object-cover"
                        onError={() => setImgFailed(true)}
                    />
                ) : (
                    <span
                        className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary-500 to-primary-700 font-bold text-white"
                        style={{ fontSize: Math.max(11, size * 0.32) }}
                    >
                        {initials}
                    </span>
                )}
                <span
                    className={`absolute inset-0 flex items-center justify-center bg-black/45 transition-opacity ${
                        busy ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                    }`}
                >
                    {busy ? (
                        <Loader2 size={iconSize} className="animate-spin text-white" />
                    ) : (
                        <Camera size={iconSize} className="text-white" />
                    )}
                </span>
            </button>

            <input
                ref={inputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleFile}
            />

            {showRemove && user?.avatar && !busy && (
                <button
                    type="button"
                    onClick={handleRemove}
                    className="text-[11px] font-medium text-slate-400 transition-colors hover:text-red-500"
                >
                    Remove photo
                </button>
            )}
        </div>
    );
};

export default AvatarUpload;
