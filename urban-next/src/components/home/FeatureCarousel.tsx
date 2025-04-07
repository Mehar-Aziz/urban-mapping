import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Leaf } from "lucide-react"
import { features } from "./Features"


export default function FeatureCarousel() {
  return (
    <section className="px-6 py-10 bg-gray-100">
      <h2 className="text-2xl font-semibold mb-6">Features</h2>
      <div className="flex space-x-4 overflow-x-auto pb-4 scrollbar-hide">
        {features.map((feature, idx) => (
          <Card key={idx} className="min-w-[280px] w-[300px] rounded-lg">
            <Image
              src={feature.image}
              alt={feature.title}
              width={300}
              height={200}
              className="rounded-t-md object-cover"
            />
            <CardContent className="py-4">
              <div className="flex items-center space-x-2 mb-2">
                <Leaf className="w-5 h-5 text-green-600" />
                <h3 className="text-md font-medium">{feature.title}</h3>
              </div>
              <p className="text-sm text-gray-600">{feature.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}
