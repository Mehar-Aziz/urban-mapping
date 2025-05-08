'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'

export default function ViewReportPage() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const reportUrl = '/urban-analysis.pdf' // your PDF path

  const handleDownload = () => {
    const link = document.createElement('a')
    link.href = reportUrl
    link.download = 'Urban-Analysis-Report.pdf'
    link.click()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="bg-white shadow-lg rounded-lg w-full max-w-5xl p-4 sm:p-6 lg:p-8">
        <div className="flex flex-col-reverse sm:flex-row justify-between gap-6">
          {/* Left Buttons */}
          <div className="flex flex-col space-y-4 sm:space-y-6 w-full sm:w-48">
            <Button onClick={handleDownload} className="w-full sm:w-40">
              Download Report
            </Button>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full sm:w-40">Open Report</Button>
              </DialogTrigger>
              <DialogContent className="max-w-5xl h-[90vh] p-0 sm:max-w-4xl lg:max-w-5xl">
                <iframe
                  src={reportUrl}
                  title="Urban Analysis PDF"
                  className="w-full h-full"
                />
              </DialogContent>
            </Dialog>
          </div>

          {/* Right Content */}
          <div className="flex-1 space-y-4 sm:space-y-6">
            <div>
              <h2 className="text-lg font-semibold">Area Selected</h2>
              <p className="text-gray-700">Clifton, Karachi</p>
            </div>
            <div>
              <h2 className="text-lg font-semibold">Air Quality</h2>
              <p className="text-gray-700">Moderate</p>
            </div>
            <div>
              <h2 className="text-lg font-semibold">NDVI Value</h2>
              <p className="text-gray-700">0.32</p>
            </div>
            <div>
              <h2 className="text-lg font-semibold">Land Surface Temperature</h2>
              <p className="text-gray-700">29.4°C</p>
            </div>
            <div>
              <h2 className="text-lg font-semibold">Overall Percentage</h2>
              <p className="text-gray-700">76%</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}