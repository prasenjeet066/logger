"use client"

import { motion } from "motion/react"

const Spinner = ({ className = '' }) => {
  const blades = Array.from({ length: 12 })
  
  return (
    <div className={`relative w-7 h-7 ${className}`}>
      {blades.map((_, i) => (
        <motion.div
          key={i}
          className="absolute left-[46%] bottom-0 w-[7%] h-[28%] bg-black/90"
          style={{
            rotate: i * 30,
            transformOrigin: "center -80%"
          }}
          animate={{ opacity: [1, 0] }}
          transition={{
            duration: 1,
            repeat: Infinity,
            ease: "linear",
            delay: i * (1 / blades.length)
          }}
        />
      ))}
    </div>
  )
}

export default Spinner
export { Spinner }