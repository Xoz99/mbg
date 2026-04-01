import React from "react"

interface SkeletonProps {
  className?: string
  variant?: "rect" | "circle" | "text"
}

const Skeleton: React.FC<SkeletonProps> = ({ className = "", variant = "rect" }) => {
  const baseClasses = "animate-shimmer bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200"
  
  const variantClasses = {
    rect: "rounded-lg",
    circle: "rounded-full",
    text: "rounded h-4 w-full"
  }

  return (
    <div 
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      aria-hidden="true"
    />
  )
}

export default Skeleton
