import React from 'react';
import {
    Home,
    BedDouble,
    Building2,
    UsersRound,
    KeyRound,
    ShieldCheck,
    MapPin,
    Sparkles,
} from 'lucide-react';

/**
 * HeroOrbit
 * ---------
 * The landing hero's visual centrepiece: a circular portrait of a real home with
 * property-type icons orbiting around it.
 *
 * The icons are rendered as SVG (not images) on purpose — they stay razor sharp
 * at any size, inherit the brand accent, animate smoothly, and cost nothing to
 * load. Only the centre is a photograph.
 *
 * Motion: the orbit rings rotate; each chip counter-rotates at the same speed so
 * the icons stay upright instead of tumbling. Respects prefers-reduced-motion.
 */

const OUTER_ITEMS = [
    { Icon: Home, label: 'Full house' },
    { Icon: BedDouble, label: 'Private room' },
    { Icon: Building2, label: 'Apartment' },
    { Icon: UsersRound, label: 'Roommate match' },
    { Icon: KeyRound, label: 'Move-in ready' },
    { Icon: ShieldCheck, label: 'CNIC verified' },
];

const INNER_ITEMS = [
    { Icon: MapPin, label: 'Multan' },
    { Icon: Sparkles, label: 'Furnished' },
    { Icon: ShieldCheck, label: 'Verified' },
];

interface HeroOrbitProps {
    /** Centre photograph */
    src?: string;
    alt?: string;
    className?: string;
}

/** Places a chip on a circle of the given radius, keeping it upright. */
const OrbitChip: React.FC<{
    index: number;
    total: number;
    radius: string;
    reverse?: boolean;
    children: React.ReactNode;
}> = ({ index, total, radius, reverse, children }) => {
    const angle = (index * 360) / total;
    return (
        <span
            className="absolute left-1/2 top-1/2"
            style={{
                transform: `translate(-50%, -50%) rotate(${angle}deg) translate(${radius}) rotate(${-angle}deg)`,
            }}
        >
            {/* counter-rotates so the glyph never tumbles */}
            <span className={reverse ? 'dv-orbit-spin' : 'dv-orbit-spin-rev'}>{children}</span>
        </span>
    );
};

export const HeroOrbit: React.FC<HeroOrbitProps> = ({
    src = '/hero-home.webp',
    alt = 'A verified home on Domavi',
    className,
}) => {
    return (
        <div
            className={`relative aspect-square w-full max-w-[520px] mx-auto select-none ${className ?? ''}`}
            aria-hidden="true"
        >
            {/* Ambient glow */}
            <div className="absolute inset-[8%] rounded-full bg-[#d4845a]/20 blur-3xl" />

            {/* Guide rings */}
            <div className="absolute inset-0 rounded-full border border-white/10" />
            <div className="absolute inset-[14%] rounded-full border border-dashed border-white/10" />

            {/* Centre photograph */}
            <div className="absolute inset-[27%] rounded-full overflow-hidden ring-2 ring-[#d4845a]/50 shadow-[0_20px_60px_rgba(0,0,0,0.55)]">
                {/* slight zoom so the source image's own soft vignette edge stays
                    outside the circular mask */}
                <img src={src} alt={alt} className="w-full h-full object-cover scale-[1.08]" loading="eager" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
            </div>

            {/* Outer orbit — clockwise */}
            <div className="absolute inset-0 dv-orbit-spin">
                {OUTER_ITEMS.map((item, i) => (
                    <OrbitChip key={item.label} index={i} total={OUTER_ITEMS.length} radius="calc(50% - 6%)">
                        <span
                            title={item.label}
                            className="flex h-12 w-12 items-center justify-center rounded-full border border-white/15 bg-[#141414]/90 backdrop-blur-sm shadow-lg"
                        >
                            <item.Icon className="h-5 w-5 text-[#d4845a]" strokeWidth={1.8} />
                        </span>
                    </OrbitChip>
                ))}
            </div>

            {/* Inner orbit — counter-clockwise, smaller + dimmer for depth */}
            <div className="absolute inset-0 dv-orbit-spin-rev dv-orbit-slow">
                {INNER_ITEMS.map((item, i) => (
                    <OrbitChip
                        key={item.label}
                        index={i}
                        total={INNER_ITEMS.length}
                        radius="calc(50% - 20%)"
                        reverse
                    >
                        <span
                            title={item.label}
                            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-[#0a0a0a]/85 backdrop-blur-sm"
                        >
                            <item.Icon className="h-4 w-4 text-[#2d8f5e]" strokeWidth={1.8} />
                        </span>
                    </OrbitChip>
                ))}
            </div>
        </div>
    );
};

export default HeroOrbit;
