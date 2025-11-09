import React, { useEffect, useState } from 'react';

const StarrySky: React.FC = () => {
    const [stars, setStars] = useState<React.ReactNode[]>([]);
    const [shootingStars, setShootingStars] = useState<React.ReactNode[]>([]);

    useEffect(() => {
        const createStars = () => {
            const starElements = [];
            const numStars = 150;
            for (let i = 0; i < numStars; i++) {
                const size = Math.random() * 1.5 + 0.5; // Star size between 0.5px and 2px
                const style: React.CSSProperties = {
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    width: `${size}px`,
                    height: `${size}px`,
                    animationDelay: `${Math.random() * 8}s`,
                    animationDuration: `${3 + Math.random() * 4}s`,
                };
                starElements.push(<div key={`star-${i}`} className="star" style={style}></div>);
            }
            setStars(starElements);
        };

        const createShootingStars = () => {
            const shootingStarElements = [];
            const numShootingStars = 7;
            for (let i = 0; i < numShootingStars; i++) {
                const style: React.CSSProperties = {
                    top: `${Math.random() * 100}%`,
                    left: '100%', // Start off screen right
                    transform: `rotate(${ -15 - Math.random() * 20 }deg)`, // Angle down and left
                    animationDelay: `${Math.random() * 12}s`,
                    animationDuration: `${1.5 + Math.random() * 2}s`,
                };
                shootingStarElements.push(
                    <div key={`shooting-wrapper-${i}`} className="shooting-star-wrapper" style={style}>
                        <div className="shooting-star"></div>
                    </div>
                );
            }
            setShootingStars(shootingStarElements);
        };

        createStars();
        createShootingStars();
    }, []);

    return (
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
            {stars}
            {shootingStars}
        </div>
    );
};

export default StarrySky;
