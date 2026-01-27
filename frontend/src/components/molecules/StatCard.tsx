import React from 'react';

interface StatCardProps {
    title: string;
    value: string | number;
    icon: React.ReactNode;
    trend?: {
        value: string;
        isUp: boolean;
    };
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, trend }) => {
    return (
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-neutral-100 flex flex-col gap-4">
            <div className="flex items-center justify-between">
                <div className="p-3 bg-[#2563EB]/10 text-[#2563EB] rounded-2xl">
                    {icon}
                </div>
                {trend && (
                    <span className={`text-xs font-bold px-2 py-1 rounded-lg ${trend.isUp ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                        }`}>
                        {trend.isUp ? '↑' : '↓'} {trend.value}
                    </span>
                )}
            </div>
            <div>
                <p className="text-sm font-medium text-neutral-500 uppercase tracking-wider">{title}</p>
                <h3 className="text-3xl font-extrabold text-[#1E293B] mt-1">{value}</h3>
            </div>
        </div>
    );
};

export default StatCard;
