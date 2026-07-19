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
 * The icons are SVG (not images) on purpose — they stay razor sharp at any size,
 * inherit the brand accent, animate smoothly, and cost nothing to load. Only the
 * centre is a photograph.
 *
 * Positioning note: chips are NOT placed with `translate(<percentage>)` — inside
 * a CSS transform a percentage resolves against the element's OWN box, not the
 * container, which collapses every chip into the middle. Instead each chip gets
 * a full-size positioner that is rotated to its angle, with the chip pinned to
 * the top edge of that circle. The radius is then just the positioner's inset,
 * which scales responsively.
 *
 * Motion: each ring rotates; inside it every chip counter-rotates (same duration,
 * opposite direction) and undoes its own static angle, so glyphs stay upright
 * instead of tumbling. Disabled under prefers-reduced-motion.
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

/**
 * One orbiting chip.
 * `counterClass` must spin opposite to the ring it lives in, so the glyph
 * stays upright while the ring turns.
 */
const OrbitChip: React.FC<{
    index: number;
    total: number;
    counterClass: string;
    children: React.ReactNode;
}> = ({ index, total, counterClass, children }) => {
    const angle = (index * 360) / total;
    return (
        // full-size positioner rotated to this item's angle
        <span className="absolute inset-0 block" style={{ transform: `rotate(${angle}deg)` }}>
            {/* pinned to the top edge of the ring */}
            <span className="absolute left-1/2 top-0 block -translate-x-1/2 -translate-y-1/2">
                {/* undo the ring's continuous spin */}
                <span className={`block ${counterClass}`}>
                    {/* undo this item's static angle */}
                    <span className="block" style={{ transform: `rotate(${-angle}deg)` }}>
                        {children}
                    </span>
                </span>
            </span>
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
            <div className="absolute inset-[10%] rounded-full bg-[#d4845a]/20 blur-3xl" />

            {/* Guide rings — aligned with the two icon orbits */}
            <div className="absolute inset-0 rounded-full border border-white/10" />
            <div className="absolute inset-[24%] rounded-full border border-dashed border-white/10" />

            {/* Centre photograph */}
            <div className="absolute inset-[33%] rounded-full overflow-hidden ring-2 ring-[#d4845a]/50 shadow-[0_20px_60px_rgba(0,0,0,0.55)]">
                {/* zoomed so the source image's own soft vignette stays outside the mask */}
                <img src={src} alt={alt} className="w-full h-full object-cover scale-[1.35]" loading="eager" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
            </div>

            {/* Outer orbit — clockwise, sits on the solid ring */}
            <div className="absolute inset-0 dv-orbit-spin">
                {OUTER_ITEMS.map((item, i) => (
                    <OrbitChip
                        key={item.label}
                        index={i}
                        total={OUTER_ITEMS.length}
                        counterClass="dv-orbit-spin-rev"
                    >
                        <span
                            title={item.label}
                            className="flex h-12 w-12 items-center justify-center rounded-full border border-white/15 bg-[#141414]/90 backdrop-blur-sm shadow-lg"
                        >
                            <item.Icon className="h-5 w-5 text-[#d4845a]" strokeWidth={1.8} />
                        </span>
                    </OrbitChip>
                ))}
            </div>

            {/* Inner orbit — counter-clockwise + slower, sits on the dashed ring */}
            <div className="absolute inset-[24%] dv-orbit-spin-rev dv-orbit-slow">
                {INNER_ITEMS.map((item, i) => (
                    <OrbitChip
                        key={item.label}
                        index={i}
                        total={INNER_ITEMS.length}
                        counterClass="dv-orbit-spin"
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
