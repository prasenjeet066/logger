import React from "react";

type IconPrefix = "fas" | "far" | "fab" | "fat" | "fa-t" | "fal" | "fad";
type IconSize = |
  "xs" |
  "sm" |
  "lg" |
  "1x" |
  "2x" |
  "3x" |
  "4x" |
  "5x" |
  "6x" |
  "7x" |
  "8x" |
  "9x" |
  "10x";

interface IconProps {
  name: string; // Example: "fa-coffee" বা শুধু "coffee"
  prefix ? : IconPrefix; // Default: "fas"
  size ? : IconSize; // Font Awesome size classes
  spin ? : boolean; // Rotating icon
  pulse ? : boolean; // Pulsing icon
  fixedWidth ? : boolean; // Fixed width icons
  className ? : string; // Extra styling classes
  onClick ? : () => void; // Click handler
  title ? : string; // Tooltip text
}

export const Icon: React.FC < IconProps > = ({
  name,
  prefix = "fas",
  size,
  spin = false,
  pulse = false,
  fixedWidth = false,
  className = "",
  onClick,
  title
}) => {
  // name যদি "fa-" দিয়ে শুরু না হয় তাহলে যোগ করুন
  const iconName = name.startsWith('fa-') ? name : `fa-${name}`;
  
  const classes = [
      prefix,
      iconName,
      size ? `fa-${size}` : "", // Font Awesome size class
      spin ? "fa-spin" : "",
      pulse ? "fa-pulse" : "",
      fixedWidth ? "fa-fw" : "",
      className
    ]
    .filter(Boolean)
    .join(" ");
  
  return (
    <i 
      className={classes} 
      onClick={onClick} 
      title={title} 
      aria-hidden="true"
      style={{ 
        cursor: onClick ? 'pointer' : 'default',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        verticalAlign: 'middle',
        lineHeight: '1'
      }}
    />
  );
};