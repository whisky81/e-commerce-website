import React, { useState, useEffect } from 'react'
import { assets } from '../assets/assets'

const Hero = () => {
    const heroImages = [
        assets.hero2,
        assets.hero3,
        assets.hero4,
        assets.hero1
    ];

    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [isTransitioning, setIsTransitioning] = useState(false);

    useEffect(() => {
        const interval = setInterval(() => {
            setIsTransitioning(true);
            
            setCurrentImageIndex((prevIndex) => 
                prevIndex === heroImages.length - 1 ? 0 : prevIndex + 1
            );

            setTimeout(() => {
                setIsTransitioning(false);
            }, 500);
            
        }, 3000); 
        return () => clearInterval(interval);
    }, []);

    const goToImage = (index) => {
        setIsTransitioning(true);
        setCurrentImageIndex(index);
        setTimeout(() => {
            setIsTransitioning(false);
        }, 500);
    };

    const nextImage = () => {
        setIsTransitioning(true);
        setCurrentImageIndex((prevIndex) => 
            prevIndex === heroImages.length - 1 ? 0 : prevIndex + 1
        );
        setTimeout(() => {
            setIsTransitioning(false);
        }, 500);
    };

    const prevImage = () => {
        setIsTransitioning(true);
        setCurrentImageIndex((prevIndex) => 
            prevIndex === 0 ? heroImages.length - 1 : prevIndex - 1
        );
        setTimeout(() => {
            setIsTransitioning(false);
        }, 500);
    };

    return (
        <div className='flex flex-col sm:flex-row border border-gray-400 relative'>
            <div className='w-full sm:w-1/2 flex items-center justify-center py-10 sm:py-0'>
                <div className='text-[#414141] px-4 sm:px-8'>
                    <div className='flex items-center gap-2 mb-4'>
                        <div className='w-8 md:w-11 h-0.5 bg-[#414141]'></div>
                        <p className='font-medium text-sm md:text-base'>Sản phẩm bán chạy</p>
                    </div>
                    <h1 className='prata-regular text-3xl md:text-4xl lg:text-5xl font-bold mb-6 leading-tight'>Hàng mới về</h1>
                    <div className='flex items-center gap-2 cursor-pointer group'>
                        <p className='font-semibold text-sm md:text-base group-hover:underline'>Mua sắm ngay</p>
                        <div className='w-8 md:w-11 h-px bg-[#414141] group-hover:w-12 transition-all duration-300'></div>
                    </div>
                </div>
            </div>

            <div className='w-full sm:w-1/2 relative overflow-hidden'>
                <div className='w-full aspect-4/3 md:aspect-video lg:aspect-4/3'>
                    <img
                        src={heroImages[currentImageIndex]}
                        alt={`hero image ${currentImageIndex + 1}`}
                        className={`w-full h-full object-cover transition-opacity duration-500 ease-in-out ${
                            isTransitioning ? 'opacity-70' : 'opacity-100'
                        }`}
                        style={{
                            objectFit: 'cover',
                            minHeight: '300px',
                            maxHeight: '500px'
                        }}
                    />
                </div>

                <button 
                    onClick={prevImage}
                    className='absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/30 hover:bg-white/50 rounded-full p-2 transition'
                >
                    <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 19l-7-7 7-7' />
                    </svg>
                </button>
                
                <button 
                    onClick={nextImage}
                    className='absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/30 hover:bg-white/50 rounded-full p-2 transition'
                >
                    <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 5l7 7-7 7' />
                    </svg>
                </button>

                <div className='absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2'>
                    {heroImages.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => goToImage(index)}
                            className={`w-2 h-2 rounded-full transition-all ${
                                index === currentImageIndex 
                                    ? 'w-6 bg-white' 
                                    : 'bg-white/50 hover:bg-white/75'
                            }`}
                        />
                    ))}
                </div>

                <div className='absolute top-4 right-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm'>
                    {currentImageIndex + 1} / {heroImages.length}
                </div>
            </div>
        </div>
    )
}

export default Hero