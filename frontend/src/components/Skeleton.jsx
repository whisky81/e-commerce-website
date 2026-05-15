// frontend/src/components/Skeleton.jsx
import React from "react";

/**
 * Skeleton loader components for loading states.
 *
 * Usage:
 *   <Skeleton.Box className="w-full h-48 rounded-xl" />
 *   <Skeleton.Text lines={3} />
 *   <Skeleton.Card />
 *   <Skeleton.ProductCard />
 *   <Skeleton.Table rows={5} cols={4} />
 */

const shimmer = "animate-pulse bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 bg-[length:200%_100%]";

const Box = ({ className = "" }) => (
  <div className={`${shimmer} rounded-lg ${className}`} />
);

const Text = ({ lines = 1, className = "" }) => (
  <div className="space-y-2">
    {Array.from({ length: lines }).map((_, i) => (
      <div
        key={i}
        className={`${shimmer} rounded h-4 ${className}`}
        style={{ width: `${i === lines - 1 ? 60 : 85 + Math.random() * 15}%` }}
      />
    ))}
  </div>
);

const Card = () => (
  <div className={`${shimmer} rounded-2xl p-5 space-y-3`}>
    <Box className="w-full h-48 rounded-xl" />
    <Text lines={2} />
    <Box className="w-24 h-6 rounded" />
  </div>
);

const ProductCard = () => (
  <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
    <Box className="w-full h-56 rounded-none" />
    <div className="p-4 space-y-3">
      <Text lines={2} />
      <Box className="w-20 h-5 rounded" />
      <div className="flex justify-between items-center">
        <Box className="w-24 h-6 rounded" />
        <Box className="w-16 h-8 rounded-xl" />
      </div>
    </div>
  </div>
);

const Table = ({ rows = 5, cols = 4 }) => (
  <div className="space-y-3">
    <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
      {Array.from({ length: cols }).map((_, i) => (
        <Box key={`h-${i}`} className="h-4 rounded" />
      ))}
    </div>
    {Array.from({ length: rows }).map((_, ri) => (
      <div key={`r-${ri}`} className="grid gap-4" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
        {Array.from({ length: cols }).map((_, ci) => (
          <Box key={`c-${ri}-${ci}`} className="h-3 rounded" />
        ))}
      </div>
    ))}
  </div>
);

const Skeleton = { Box, Text, Card, ProductCard, Table };

export default Skeleton;
