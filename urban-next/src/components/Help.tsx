import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export default function HelpPage() {
  return (
    <div className="container py-6 px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* FAQs Section - Top on Mobile */}
        <div className="order-1 md:order-2 md:col-span-1">
          <h2 className="text-2xl font-semibold mb-6">Frequently Asked Questions</h2>
          
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger>What kind of images are analyzed?</AccordionTrigger>
              <AccordionContent>
                A: Satellite imagery from Sentinal and Landsat. We analyze data from various satellites to provide the most accurate and up-to-date information.
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-2">
              <AccordionTrigger>How often is the data updated?</AccordionTrigger>
              <AccordionContent>
                A: The data is updated daily for most regions, depending on satellite availability and weather conditions.
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-3">
              <AccordionTrigger>Need more help?</AccordionTrigger>
              <AccordionContent>
                <p>Still stuck? Get in touch with us:</p>
                <ul className="list-disc pl-5 mt-2">
                  <li>Email us at: support@example.com</li>
                  <li>Call our support team at: (Mon-Fri, 9-5)</li>
                  <li>Live support: Chat now from our homepage</li>
                </ul>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
        
        {/* Contact Form Section - Bottom on Mobile */}
        <div className="order-2 md:order-1 md:col-span-2">
          <h2 className="text-2xl font-semibold mb-6">Help</h2>
          
          <Tabs defaultValue="email" className="w-full">
            <TabsList className="grid grid-cols-3 mb-6 gap-2 sm:gap-4">
              <TabsTrigger value="email">Email</TabsTrigger>
              <TabsTrigger value="phone">Phone</TabsTrigger>
              <TabsTrigger value="chat">Live Chat</TabsTrigger>
            </TabsList>
            
            <TabsContent value="email" className="space-y-4">
              <Card>
                <CardContent className="pt-6">
                  <form className="space-y-4">
                    <div>
                      <Input placeholder="Your Name" />
                    </div>
                    <div>
                      <Input placeholder="Email" />
                    </div>
                    <div>
                      <Input placeholder="Subject" />
                    </div>
                    <div>
                      <Textarea placeholder="Message" rows={5} />
                    </div>
                    <Button type="submit" className="w-full bg-black text-white hover:bg-gray-800">Send</Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="phone">
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Contact by Phone</h3>
                    <p>Call our support team at: <span className="font-semibold">1-800-123-4567</span></p>
                    <p>Hours of operation: Monday to Friday, 9am - 5pm EST</p>
                    <p>For urgent matters, we're available 24/7 at our emergency line: <span className="font-semibold">1-888-999-0000</span></p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="chat">
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Live Chat Support</h3>
                    <p>Our chat support is available from 8am to 8pm, 7 days a week.</p>
                    <Button className="w-full bg-black text-white hover:bg-gray-800">Start Chat Now</Button>
                    <p className="text-sm text-gray-500">Average wait time: 2 minutes</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}