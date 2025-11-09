import React from 'react';
import { DataSource, Skill, SkillCategory } from '../types';
import SkillSuggestions from './SkillSuggestions';
import FutureSkillsForecaster from './FutureSkillsForecaster';
import { AcademicCapIcon, BriefcaseIcon, LightBulbIcon, StarIcon } from './common/Icon';
import DataSourceInput from './DataSourceInput';

// Color mapping for different skill categories used in the chart.
const categoryColors: { [key in SkillCategory]: string } = {
  [SkillCategory.Technical]: '#3b82f6', // blue-500
  [SkillCategory.SoftSkill]: '#22c55e', // green-500
  [SkillCategory.Leadership]: '#a855f7', // purple-500
  [SkillCategory.Language]: '#14b8a6', // teal-500
  [SkillCategory.Other]: '#6b7280', // gray-500
};

/**
 * Generates the SVG path for a circular chart segment.
 * @param startAngle The starting angle in radians.
 * @param endAngle The ending angle in radians.
 * @param radius The radius of the circle.
 * @returns An SVG path string.
 */
const getPath = (startAngle: number, endAngle: number, radius: number) => {
    const start = {
        x: radius * Math.cos(startAngle),
        y: radius * Math.sin(startAngle),
    };
    const end = {
        x: radius * Math.cos(endAngle),
        y: radius * Math.sin(endAngle),
    };
    const largeArcFlag = endAngle - startAngle <= Math.PI ? '0' : '1';
    return [
        'M', start.x, start.y,
        'A', radius, radius, 0, largeArcFlag, 1, end.x, end.y,
    ].join(' ');
};

/**
 * A donut chart component to visualize the distribution of skill categories.
 */
const SkillCategoryChart: React.FC<{ skills: Skill[] }> = ({ skills }) => {
    const totalSkills = skills.length;
    if (totalSkills === 0) return null;

    // FIX: By providing a type for the initial value of `reduce`, we ensure TypeScript
    // correctly infers the type of `categoryCounts` as `Record<SkillCategory, number>`.
    // This prevents downstream arithmetic errors where property values were being inferred as `unknown`.
    const categoryCounts = skills.reduce((acc, skill) => {
        acc[skill.category] = (acc[skill.category] || 0) + 1;
        return acc;
    }, {} as Record<SkillCategory, number>);
    
    // Prepare data for rendering, including sorting for consistent chart layout.
    const data = Object.entries(categoryCounts).map(([name, value]) => ({
        name,
        value,
        color: categoryColors[name as SkillCategory]
    })).sort((a,b) => b.value - a.value);

    let cumulative = 0;
    const segments = data.map(item => {
        const percentage = item.value / totalSkills;
        const startAngle = (cumulative / totalSkills) * 2 * Math.PI - Math.PI / 2;
        const endAngle = (cumulative + item.value) / totalSkills * 2 * Math.PI - Math.PI / 2;
        cumulative += item.value;
        return { ...item, percentage, startAngle, endAngle };
    });

    const radius = 80;
    const strokeWidth = 25;

    return (
        <div className="flex flex-col md:flex-row items-center justify-center gap-8 p-4">
            <div className="relative">
                <svg width="200" height="200" viewBox="-100 -100 200 200">
                    <circle cx="0" cy="0" r={radius - strokeWidth / 2} fill="none" stroke="#374151" strokeWidth={strokeWidth} />
                    {segments.map((segment) => (
                        <path
                            key={segment.name}
                            d={getPath(segment.startAngle, segment.endAngle, radius - strokeWidth / 2)}
                            fill="none"
                            stroke={segment.color}
                            strokeWidth={strokeWidth}
                            strokeLinecap="round"
                        />
                    ))}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-4xl font-bold text-white">{totalSkills}</span>
                    <span className="text-sm text-gray-400">Total Skills</span>
                </div>
            </div>
            <div className="flex flex-col gap-3">
                {segments.map(segment => (
                    <div key={segment.name} className="flex items-center">
                        <div className="w-4 h-4 rounded-sm mr-3" style={{ backgroundColor: segment.color }}></div>
                        <div className="flex justify-between w-48">
                            <span className="text-gray-300">{segment.name}</span>
                            <span className="font-semibold text-white">{segment.value} ({Math.round(segment.percentage * 100)}%)</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};


interface StatCardProps {
    title: string;
    value: number | string;
    icon: React.ReactNode;
    color: string;
}
/**
 * A card component for displaying key statistics.
 */
const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color }) => (
    <div className="bg-white/5 backdrop-blur-md border border-white/10 p-5 rounded-xl flex items-center gap-4 transition-all duration-300 ease-out transform hover:-translate-y-2 hover:shadow-lg hover:shadow-amber-500/10">
        <div className={`p-3 rounded-full ${color}`}>
            {icon}
        </div>
        <div>
            <p className="text-sm text-gray-400">{title}</p>
            <p className="text-2xl font-bold text-white">{value}</p>
        </div>
    </div>
);

interface DashboardProps {
    skills: Skill[];
    onAnalyze: (sources: DataSource[]) => void;
    isLoading: boolean;
}

const Dashboard: React.FC<DashboardProps> = ({ skills, onAnalyze, isLoading }) => {
    const hasProfile = skills.length > 0;
    const totalSkills = skills.length;
    const categoryCounts = skills.reduce((acc, skill) => {
        acc[skill.category] = (acc[skill.category] || 0) + 1;
        return acc;
    }, {} as { [key in SkillCategory]?: number });

    return (
        <div className="space-y-8">
             <div className="bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-xl animate-fade-in-up" style={{ animationDelay: '0.1s', opacity: 0 }}>
                <h2 className="text-xl font-bold text-white mb-2">Build Your Skill Profile</h2>
                <p className="text-gray-400 mb-4 text-sm">Add your CV, performance reviews, or links to professional profiles to get started.</p>
                <DataSourceInput onAnalyze={onAnalyze} isLoading={isLoading} />
            </div>

            {hasProfile && (
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 animate-fade-in-up" style={{ animationDelay: '0.3s', opacity: 0 }}>
                    {/* Main content area */}
                    <div className="lg:col-span-3 space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <StatCard title="Total Skills" value={totalSkills} icon={<StarIcon className="w-6 h-6 text-amber-400"/>} color="bg-amber-500/10" />
                            <StatCard title="Technical" value={categoryCounts.Technical || 0} icon={<BriefcaseIcon className="w-6 h-6 text-blue-400"/>} color="bg-blue-500/10" />
                            <StatCard title="Soft Skills" value={categoryCounts['Soft Skill'] || 0} icon={<LightBulbIcon className="w-6 h-6 text-green-400"/>} color="bg-green-500/10" />
                            <StatCard title="Leadership" value={categoryCounts.Leadership || 0} icon={<AcademicCapIcon className="w-6 h-6 text-purple-400"/>} color="bg-purple-500/10" />
                        </div>

                        <div className="bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-xl">
                            <h2 className="text-xl font-bold text-white mb-4">Skills by Category</h2>
                            <SkillCategoryChart skills={skills} />
                        </div>
                    </div>
                    {/* Right-hand insights column */}
                    <div className="lg:col-span-2 space-y-8">
                        <div className="bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-xl">
                            <SkillSuggestions userSkills={skills} />
                        </div>
                        <div className="bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-xl">
                            <FutureSkillsForecaster userSkills={skills} />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Dashboard;