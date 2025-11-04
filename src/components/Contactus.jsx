'use client';
import { Mail, Phone, MapPin, Clock, Navigation, ArrowRight, Linkedin, Facebook, Twitter, Instagram } from 'lucide-react';
import Image from 'next/image';

export default function ContactUsPage() {
  return (
      <div id="contactus" className="min-h-screen flex flex-col bg-gray-50">


      <main className="flex-grow">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-teal-600 via-emerald-600 to-teal-600 text-white py-10 sm:py-12 md:py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-2 sm:mb-3 md:mb-4">Contact Us</h1>
              <p className="max-w-2xl mx-auto text-teal-50 text-sm sm:text-base px-2">
                Get in touch with our team. We're here to help with any questions you may have.
              </p>
            </div>
          </div>
        </div>

        {/* Contact Information Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 md:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6 md:gap-8">
            {/* Main Contact Card */}
            <div className="lg:col-span-2 bg-white rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden border border-teal-100/50 hover:shadow-3xl transition-all duration-500">
              <div className="h-1.5 bg-gradient-to-r from-teal-500 via-emerald-500 to-cyan-500"></div>
              <div className="grid grid-cols-1 md:grid-cols-2">
                {/* Map Section */}
                <div className="h-56 sm:h-64 md:h-full bg-gray-200 relative overflow-hidden order-2 md:order-1">
                  <Image
                    src="/image.png"
                    alt="Map location of our office"
                    fill
                    className="object-cover transition-transform duration-500 hover:scale-110"
                    sizes="(max-width: 768px) 100vw, 50vw"
                    quality={85}
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                </div>
                
                {/* Contact Information Section */}
                <div className="p-5 sm:p-6 md:p-8 lg:p-10 bg-gradient-to-br from-slate-50 via-teal-50 to-emerald-50 order-1 md:order-2">
                  <div className="mb-6 sm:mb-8 md:mb-10">
                    <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold bg-gradient-to-r from-teal-700 to-emerald-700 bg-clip-text text-transparent mb-2 sm:mb-3">
                      M/s Wings e-Business Services
                    </h2>
                    <div className="w-16 sm:w-20 h-1 sm:h-1.5 bg-gradient-to-r from-teal-600 to-emerald-600 mb-4 sm:mb-6 md:mb-8 rounded-full"></div>
                    
                    <div className="space-y-4 sm:space-y-5 md:space-y-6">
                      <div className="flex items-start space-x-3 sm:space-x-4 bg-white p-3 sm:p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow border border-teal-50">
                        <div className="bg-gradient-to-br from-teal-500 to-emerald-600 p-2 sm:p-3 rounded-xl flex-shrink-0 shadow-lg">
                          <MapPin className="text-white" size={18} strokeWidth={2.5} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-gray-900 mb-1 sm:mb-2 text-sm sm:text-base md:text-lg">Address</h3>
                          <p className="text-gray-700 leading-relaxed text-xs sm:text-sm md:text-base">
                            No 119, 3rd Floor, The Oasis Building, 8th Cross,<br className="hidden sm:block" />
                            Pai Layout, Doorvaninagar Post,<br className="hidden sm:block" />
                            Bengaluru-560016
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-start space-x-3 sm:space-x-4 bg-white p-3 sm:p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow border border-teal-50">
                        <div className="bg-gradient-to-br from-teal-500 to-emerald-600 p-2 sm:p-3 rounded-xl flex-shrink-0 shadow-lg">
                          <Phone className="text-white" size={18} strokeWidth={2.5} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-gray-900 mb-1 sm:mb-2 text-sm sm:text-base md:text-lg">Phone</h3>
                          <p className="text-gray-700 text-xs sm:text-sm md:text-base">
                            <a href="tel:+919902991133" className="hover:text-teal-600 transition-colors font-semibold text-sm sm:text-base break-all">+91-9902991133</a>
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-start space-x-3 sm:space-x-4 bg-white p-3 sm:p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow border border-teal-50">
                        <div className="bg-gradient-to-br from-teal-500 to-emerald-600 p-2 sm:p-3 rounded-xl flex-shrink-0 shadow-lg">
                          <Mail className="text-white" size={18} strokeWidth={2.5} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-gray-900 mb-1 sm:mb-2 text-sm sm:text-base md:text-lg">Email</h3>
                          <p className="text-gray-700 text-xs sm:text-sm md:text-base">
                            <a href="mailto:Wingsebs@gmail.com" className="hover:text-teal-600 transition-colors font-semibold break-all">
                              Wingsebs@gmail.com
                            </a>
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-6 sm:mt-8 md:mt-10 pt-4 sm:pt-6 md:pt-8 border-t-2 border-gray-200">
                    <div className="flex flex-col sm:flex-row sm:justify-center gap-3 sm:gap-4">
                      <a href="mailto:Wingsebs@gmail.com" className="bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-bold py-3 sm:py-3.5 px-6 sm:px-8 rounded-xl transition-all duration-300 flex items-center justify-center shadow-xl hover:shadow-2xl transform hover:scale-105 active:scale-95 gap-2 touch-manipulation text-sm sm:text-base">
                        <Mail size={18} strokeWidth={2.5} />
                        Email Us
                      </a>
                      <a href="tel:+919902991133" className="bg-slate-700 hover:bg-slate-800 text-white font-bold py-3 sm:py-3.5 px-6 sm:px-8 rounded-xl transition-all duration-300 flex items-center justify-center shadow-xl hover:shadow-2xl transform hover:scale-105 active:scale-95 gap-2 touch-manipulation text-sm sm:text-base">
                        <Phone size={18} strokeWidth={2.5} />
                        Call Now
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Information Card */}
            <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl p-5 sm:p-6 md:p-8 lg:p-10 border border-teal-100/50 hover:shadow-3xl transition-all duration-500 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-teal-500 to-emerald-500"></div>
              <h3 className="text-xl sm:text-2xl md:text-3xl font-extrabold bg-gradient-to-r from-teal-700 to-emerald-700 bg-clip-text text-transparent mb-4 sm:mb-6 md:mb-8">Business Hours</h3>
              
              <div className="space-y-3 sm:space-y-4 md:space-y-5 mb-6 sm:mb-8 md:mb-10">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center bg-teal-50 p-3 sm:p-4 rounded-xl border border-teal-100 gap-1 sm:gap-0">
                  <span className="text-gray-700 text-xs sm:text-sm md:text-base font-semibold">Monday - Friday</span>
                  <span className="text-teal-700 font-bold text-xs sm:text-sm md:text-base">9:00 AM - 6:00 PM</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center bg-emerald-50 p-3 sm:p-4 rounded-xl border border-emerald-100 gap-1 sm:gap-0">
                  <span className="text-gray-700 text-xs sm:text-sm md:text-base font-semibold">Saturday</span>
                  <span className="text-emerald-700 font-bold text-xs sm:text-sm md:text-base">9:00 AM - 1:00 PM</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center bg-gray-50 p-3 sm:p-4 rounded-xl border border-gray-100 gap-1 sm:gap-0">
                  <span className="text-gray-700 text-xs sm:text-sm md:text-base font-semibold">Sunday</span>
                  <span className="text-gray-500 font-bold text-xs sm:text-sm md:text-base">Closed</span>
                </div>
              </div>
              
              <div className="border-t-2 border-gray-200 pt-4 sm:pt-6 md:pt-8 mt-4 sm:mt-6 md:mt-8">
                <h3 className="text-xl sm:text-2xl md:text-3xl font-extrabold bg-gradient-to-r from-teal-700 to-emerald-700 bg-clip-text text-transparent mb-3 sm:mb-4 md:mb-5">Our Location</h3>
                <p className="text-gray-700 mb-4 text-sm sm:text-base md:text-lg leading-relaxed font-medium">
                  Located in the heart of <span className="font-bold text-teal-700">Bengaluru</span>, we're easily accessible by public transport.
                </p>
                {/* <div className="flex items-center text-blue-600 font-medium">
                  <Navigation size={18} className="mr-2" />
                  <span>Get Directions</span>
                  <ArrowRight size={16} className="ml-1" />
                </div> */}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}