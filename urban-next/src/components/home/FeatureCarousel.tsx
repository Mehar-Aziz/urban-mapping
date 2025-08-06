import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Leaf } from "lucide-react"
import { features } from "./Features"


export default function FeatureCarousel() {
  return (
    <section className="px-4 sm:px-6 py-8 sm:py-10 bg-gray-100">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-100 rounded-2xl mb-6">
            <Leaf className="w-8 h-8 text-emerald-600" />
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4 tracking-tight">
            Advanced
            <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent"> Features</span>
          </h2>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Comprehensive environmental analysis tools powered by cutting-edge technology
          </p>
        </div>
        
        {/* Carousel Container */}
        <div className="relative">
          {/* Horizontal Scrollable Area */}
          <div 
            className="flex space-x-3 sm:space-x-4 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory scroll-smooth"
            style={{ 
              WebkitOverflowScrolling: 'touch',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none'
            }}
          >
            {/* Left padding spacer for visual margin */}
            <div className="shrink-0 w-2 sm:w-4 md:w-0" />
            
            {features.map((feature, idx) => (
              <Card 
                key={idx} 
                className="shrink-0 snap-center rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 w-[260px] xs:w-[280px] sm:w-[300px]"
              >
                <div className="relative w-full h-32 sm:h-40 md:h-48">
                  <Image
                    src={feature.image}
                    alt={feature.title}
                    fill
                    className="rounded-t-md object-cover pr-4 pl-4"
                    sizes="(max-width: 640px) 260px, (max-width: 768px) 280px, 300px"
                  />
                </div>
                <CardContent className="py-3 sm:py-2">
                  <div className="flex items-center space-x-2 mb-1 sm:mb-2">
                    <Leaf className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                    <h3 className="text-sm sm:text-md font-medium">{feature.title}</h3>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-600 line-clamp-3">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
            
            {/* Right padding spacer for visual margin */}
            <div className="shrink-0 w-2 sm:w-4 md:w-0" />
          </div>
        </div>
      </div>
    </section>
  )
}