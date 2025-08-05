// export default function Hero() {
//   return (
//     <section className="py-10 sm:py-16 md:py-20 px-4 sm:px-6 md:px-8 text-center bg-gradient-to-br from-[#00674F] to-white">
//       <div className="max-w-7xl mx-auto">
//         <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-800 mb-3 sm:mb-4 md:mb-6 leading-tight">
//           Urban mapping with Deep Learning
//         </h1>
//         <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-xs sm:max-w-lg md:max-w-2xl mx-auto leading-relaxed">
//           Harness the power of deep learning to map urban environments, detect changes, and visualize city growth with satellite and spatial data.
//         </p>

//         {/* Optional: Add a CTA button for better user engagement */}
//         <div className="mt-6 sm:mt-8 md:mt-10">
//           <button className="bg-[#00674F] hover:bg-[#00573F] text-white font-medium py-2 px-6 sm:py-3 sm:px-8 rounded-md text-sm sm:text-base transition-colors duration-300 shadow-md hover:shadow-lg">
//             Get Started
//           </button>
//         </div>
//       </div>
//     </section>
//   )
// }

"use client"
import React from "react";
import { Button } from "@/components/ui/button";

export default function Hero() {
  return (
    <section className="relative py-10 sm:py-16 md:py-20 px-4 sm:px-6 md:px-8 text-center overflow-hidden">
      {/* Background Video */}
      <div className="absolute inset-0 w-full h-full">
        <video
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          className="absolute inset-0 w-full h-full object-cover"
          poster="/earth-poster.jpg"
        >
          <source src="/video/heroBG.mp4" type="video/mp4" />
          {/* Fallback for browsers that don't support video */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#00674F] to-white" />
        </video>
        <div className="absolute inset-0 bg-black/30" />
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#00674F]/60 via-transparent to-white/40" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto">
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-3 sm:mb-4 md:mb-6 leading-tight drop-shadow-lg">
  Where Land Tells Its Story<br />
  <span className="text-3xl sm:text-3xl md:text-5xl font-medium">Explore, Compare, Discover</span>
</h1>


        <p className="text-base sm:text-lg md:text-xl text-white/90 max-w-xs sm:max-w-lg md:max-w-2xl mx-auto leading-relaxed drop-shadow-md">
          Harness the power of deep learning to map urban environments, detect
          changes, and visualize city growth with satellite and spatial data.
        </p>

        {/* Button */}
        <div className="mt-6 sm:mt-8 md:mt-10">
          <Button className="bg-[#00674F] hover:bg-[#00573F] text-white font-medium py-2 px-6 sm:py-5 sm:px-8 rounded-md text-sm sm:text-base transition-all duration-300 shadow-lg hover:shadow-xl backdrop-blur-sm border border-white/10">
            Get Started
          </Button>
        </div>
      </div>
    </section>
  );
}
