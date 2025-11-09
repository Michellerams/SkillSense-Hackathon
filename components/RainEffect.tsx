import React, { useEffect, useState } from 'react';

const RainEffect: React.FC = () => {
    const [raindrops, setRaindrops] = useState<React.ReactNode[]>([]);

    useEffect(() => {
        const createRaindrops = () => {
            const drops = [];
            const numDrops = 150; // Adjust for density
            for (let i = 0; i < numDrops; i++) {
                const style: React.CSSProperties = {
                    left: `${Math.random() * 100}%`,
                    animationDuration: `${0.5 + Math.random() * 0.5}s`,
                    animationDelay: `${Math.random() * 7}s`,
                    height: `${20 + Math.random() * 40}px`
                };
                drops.push(<div key={i} className="raindrop" style={style}></div>);
            }
            setRaindrops(drops);
        };

        createRaindrops();
    }, []);

    return <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">{raindrops}</div>;
};

export default RainEffect;
