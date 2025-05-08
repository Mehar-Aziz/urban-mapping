export default function Hero() {
  return (
    <section className="py-10 sm:py-16 md:py-20 px-4 sm:px-6 md:px-8 text-center bg-gradient-to-br from-[#00674F] to-white">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-800 mb-3 sm:mb-4 md:mb-6 leading-tight">
          Urban mapping with Deep Learning
        </h1>
        <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-xs sm:max-w-lg md:max-w-2xl mx-auto leading-relaxed">
          Harness the power of deep learning to map urban environments, detect changes, and visualize city growth with satellite and spatial data.
        </p>
        
        {/* Optional: Add a CTA button for better user engagement */}
        <div className="mt-6 sm:mt-8 md:mt-10">
          <button className="bg-[#00674F] hover:bg-[#00573F] text-white font-medium py-2 px-6 sm:py-3 sm:px-8 rounded-md text-sm sm:text-base transition-colors duration-300 shadow-md hover:shadow-lg">
            Get Started
          </button>
        </div>
      </div>
    </section>
  )
}