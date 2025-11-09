
import React, { useMemo, useState } from 'react';
import { Skill, SkillCategory } from '../types';
import { InformationCircleIcon } from './common/Icon';

interface SkillRadarChartProps {
    userSkills: Skill[];
    jobSkills: Skill[];
}

interface ChartData {
    category: SkillCategory;
    userValue: number;
    jobValue: number;
    userSkills: string[];
    jobSkills: string[];
}

interface TooltipData {
    x: number;
    y: number;
    data: ChartData;
}

const SkillRadarChart: React.FC<SkillRadarChartProps> = ({ userSkills, jobSkills }) => {
    const [tooltip, setTooltip] = useState<TooltipData | null>(null);

    const chartData = useMemo<ChartData[]>(() => {
        const categories: SkillCategory[] = [
            SkillCategory.Technical,
            SkillCategory.SoftSkill,
            SkillCategory.Leadership,
            SkillCategory.Language,
            SkillCategory.Other,
        ];
        
        return categories.map(category => {
            const relevantUserSkills = userSkills.filter(s => s.category === category);
            const relevantJobSkills = jobSkills.filter(s => s.category === category);

            const userValue = relevantUserSkills.length > 0
                ? relevantUserSkills.reduce((sum, s) => sum + s.confidence, 0) / relevantUserSkills.length
                : 0;
            
            const jobValue = relevantJobSkills.length > 0
                ? relevantJobSkills.reduce((sum, s) => sum + s.confidence, 0) / relevantJobSkills.length
                : 0;

            return {
                category,
                userValue,
                jobValue,
                userSkills: relevantUserSkills.map(s => s.name),
                jobSkills: relevantJobSkills.map(s => s.name),
            };
        });
    }, [userSkills, jobSkills]);
    
    const size = 400;
    const center = size / 2;
    const radius = size * 0.4;
    const numLevels = 4;
    const angleSlice = (Math.PI * 2) / chartData.length;

    const getCoordinates = (angle: number, value: number) => ({
        x: center + radius * (value / 100) * Math.cos(angle - Math.PI / 2),
        y: center + radius * (value / 100) * Math.sin(angle - Math.PI / 2),
    });

    const userPath = chartData.map((d, i) => {
        const { x, y } = getCoordinates(angleSlice * i, d.userValue);
        return `${x},${y}`;
    }).join(' ');

    const jobPath = chartData.map((d, i) => {
        const { x, y } = getCoordinates(angleSlice * i, d.jobValue);
        return `${x},${y}`;
    }).join(' ');
    
    const handleMouseOver = (e: React.MouseEvent, index: number) => {
        const data = chartData[index];
        const {x, y} = getCoordinates(angleSlice * index, Math.max(data.jobValue, data.userValue, 20));
        setTooltip({ x, y, data });
    };

    return (
      <div className="relative w-full max-w-lg mx-auto flex flex-col items-center">
            <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-auto">
                {/* Grid Levels */}
                {[...Array(numLevels)].map((_, level) => (
                    <polygon
                        key={level}
                        points={chartData.map((_, i) => {
                            const { x, y } = getCoordinates(angleSlice * i, ((level + 1) / numLevels) * 100);
                            return `${x},${y}`;
                        }).join(' ')}
                        className="fill-none stroke-gray-700"
                    />
                ))}

                {/* Axes */}
                {chartData.map((d, i) => {
                    const { x, y } = getCoordinates(angleSlice * i, 100);
                    const labelCoords = getCoordinates(angleSlice * i, 115);
                    return (
                        <g key={d.category}>
                            <line x1={center} y1={center} x2={x} y2={y} className="stroke-gray-700" />
                            <text
                                x={labelCoords.x}
                                y={labelCoords.y}
                                textAnchor={labelCoords.x > center ? 'start' : labelCoords.x < center ? 'end' : 'middle'}
                                dy="0.33em"
                                className="text-xs font-semibold fill-gray-400"
                            >
                                {d.category}
                            </text>
                        </g>
                    );
                })}
                
                 {/* Data Polygons */}
                <polygon points={jobPath} className="fill-purple-500/30 stroke-purple-500" strokeWidth="2" />
                <polygon points={userPath} className="fill-amber-500/40 stroke-amber-500" strokeWidth="2" />

                {/* Interactive Points */}
                {chartData.map((d, i) => {
                    const userCoords = getCoordinates(angleSlice * i, d.userValue);
                    const jobCoords = getCoordinates(angleSlice * i, d.jobValue);
                    return (
                        <g key={`points-${d.category}`} onMouseOver={(e) => handleMouseOver(e, i)} onMouseOut={() => setTooltip(null)}>
                            <rect x={Math.min(userCoords.x, jobCoords.x) -8} y={Math.min(userCoords.y, jobCoords.y) - 8} width={Math.abs(userCoords.x - jobCoords.x) + 16} height={Math.abs(userCoords.y - jobCoords.y) + 16} fill="transparent" />
                            <circle cx={jobCoords.x} cy={jobCoords.y} r="5" className="fill-purple-500 cursor-pointer" />
                            <circle cx={userCoords.x} cy={userCoords.y} r="5" className="fill-amber-500 cursor-pointer" />
                        </g>
                    );
                })}
            </svg>
            
            {/* Legend */}
            <div className="flex items-center justify-center gap-6 mt-4">
                <div className="flex items-center">
                    <div className="w-4 h-4 rounded-full bg-amber-500/80 mr-2 border-2 border-amber-500"></div>
                    <span className="text-sm font-medium text-gray-300">Your Skills</span>
                </div>
                <div className="flex items-center">
                    <div className="w-4 h-4 rounded-full bg-purple-500/80 mr-2 border-2 border-purple-500"></div>
                    <span className="text-sm font-medium text-gray-300">Job Requirements</span>
                </div>
            </div>

            {/* Tooltip */}
            {tooltip && (
                <div 
                    className="absolute bg-gray-900 text-white rounded-lg shadow-2xl p-4 text-xs w-64 border border-gray-700 pointer-events-none transition-opacity duration-200"
                    style={{ 
                        left: `${tooltip.x}px`, 
                        top: `${tooltip.y}px`, 
                        transform: `translate(${tooltip.x > center ? '-110%' : '10%'}, ${tooltip.y > center ? '-110%' : '10%'})` 
                    }}
                >
                    <div className="flex items-center mb-3">
                        <InformationCircleIcon className="w-5 h-5 text-gray-400 mr-2 flex-shrink-0" />
                        <h3 className="font-bold text-base">{tooltip.data.category}</h3>
                    </div>
                    <div className="space-y-3">
                        <div>
                            <p className="font-semibold text-amber-400 mb-1">Your Avg: {Math.round(tooltip.data.userValue)}%</p>
                            <p className="text-gray-300">{tooltip.data.userSkills.join(', ') || 'No skills in this category'}</p>
                        </div>
                         <div>
                            <p className="font-semibold text-purple-400 mb-1">Job Avg: {Math.round(tooltip.data.jobValue)}%</p>
                            <p className="text-gray-300">{tooltip.data.jobSkills.join(', ') || 'No required skills'}</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SkillRadarChart;
