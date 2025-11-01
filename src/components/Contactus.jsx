import { Mail, Phone, MapPin, Clock, Navigation, ArrowRight, Linkedin, Facebook, Twitter, Instagram } from 'lucide-react';

export default function ContactUsPage() {
  return (
      <div id="contactus" className="min-h-screen flex flex-col bg-gray-50">


      <main className="flex-grow">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-teal-600 via-emerald-600 to-teal-600 text-white py-12 sm:py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="text-center">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3 sm:mb-4">Contact Us</h1>
              <p className="max-w-2xl mx-auto text-teal-50 text-sm sm:text-base">
                Get in touch with our team. We're here to help with any questions you may have.
              </p>
            </div>
          </div>
        </div>

        {/* Contact Information Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
            {/* Main Contact Card */}
            <div className="lg:col-span-2 bg-white rounded-3xl shadow-2xl overflow-hidden border border-teal-100/50 hover:shadow-3xl transition-all duration-500">
              <div className="h-1.5 bg-gradient-to-r from-teal-500 via-emerald-500 to-cyan-500"></div>
              <div className="grid grid-cols-1 md:grid-cols-2">
                {/* Map Section */}
                <div className="h-64 md:h-full bg-gray-200 relative overflow-hidden">
                  <img 
                    src="/image.png" 
                    alt="Map location of our office" 
                    className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                </div>
                
                {/* Contact Information Section */}
                <div className="p-8 sm:p-10 bg-gradient-to-br from-slate-50 via-teal-50 to-emerald-50">
                  <div className="mb-8 sm:mb-10">
                    <h2 className="text-2xl sm:text-3xl font-extrabold bg-gradient-to-r from-teal-700 to-emerald-700 bg-clip-text text-transparent mb-3">
                      M/s Wings e-Business Services
                    </h2>
                    <div className="w-20 h-1.5 bg-gradient-to-r from-teal-600 to-emerald-600 mb-6 sm:mb-8 rounded-full"></div>
                    
                    <div className="space-y-5 sm:space-y-6">
                      <div className="flex items-start space-x-4 bg-white p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow border border-teal-50">
                        <div className="bg-gradient-to-br from-teal-500 to-emerald-600 p-3 rounded-xl flex-shrink-0 shadow-lg">
                          <MapPin className="text-white" size={22} />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-gray-900 mb-2 text-base sm:text-lg">Address</h3>
                          <p className="text-gray-700 leading-relaxed text-sm sm:text-base">
                            No 119, 3rd Floor, The Oasis Building, 8th Cross,<br />
                            Pai Layout, Doorvaninagar Post,<br />
                            Bengaluru-560016
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-start space-x-4 bg-white p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow border border-teal-50">
                        <div className="bg-gradient-to-br from-teal-500 to-emerald-600 p-3 rounded-xl flex-shrink-0 shadow-lg">
                          <Phone className="text-white" size={22} />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-gray-900 mb-2 text-base sm:text-lg">Phone</h3>
                          <p className="text-gray-700 text-sm sm:text-base">
                            <a href="tel:+919902991133" className="hover:text-teal-600 transition-colors font-semibold text-base">+91-9902991133</a>
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-start space-x-4 bg-white p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow border border-teal-50">
                        <div className="bg-gradient-to-br from-teal-500 to-emerald-600 p-3 rounded-xl flex-shrink-0 shadow-lg">
                          <Mail className="text-white" size={22} />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-gray-900 mb-2 text-base sm:text-lg">Email</h3>
                          <p className="text-gray-700 text-sm sm:text-base">
                            <a href="mailto:Wingsebs@gmail.com" className="hover:text-teal-600 transition-colors font-semibold">
                              Wingsebs@gmail.com
                            </a>
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-8 sm:mt-10 pt-6 sm:pt-8 border-t-2 border-gray-200">
                    <div className="flex flex-col sm:flex-row sm:justify-center gap-4">
                      <a href="mailto:Wingsebs@gmail.com" className="bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-bold py-3.5 px-8 rounded-xl transition-all duration-300 flex items-center justify-center shadow-xl hover:shadow-2xl transform hover:scale-105 gap-2">
                        <Mail size={20} />
                        Email Us
                      </a>
                      <a href="tel:+919902991133" className="bg-slate-700 hover:bg-slate-800 text-white font-bold py-3.5 px-8 rounded-xl transition-all duration-300 flex items-center justify-center shadow-xl hover:shadow-2xl transform hover:scale-105 gap-2">
                        <Phone size={20} />
                        Call Now
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Information Card */}
            <div className="bg-white rounded-3xl shadow-2xl p-8 sm:p-10 border border-teal-100/50 hover:shadow-3xl transition-all duration-500 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-teal-500 to-emerald-500"></div>
              <h3 className="text-2xl sm:text-3xl font-extrabold bg-gradient-to-r from-teal-700 to-emerald-700 bg-clip-text text-transparent mb-6 sm:mb-8">Business Hours</h3>
              
              <div className="space-y-4 sm:space-y-5 mb-8 sm:mb-10">
                <div className="flex justify-between items-center bg-teal-50 p-4 rounded-xl border border-teal-100">
                  <span className="text-gray-700 text-sm sm:text-base font-semibold">Monday - Friday</span>
                  <span className="text-teal-700 font-bold text-sm sm:text-base">9:00 AM - 6:00 PM</span>
                </div>
                <div className="flex justify-between items-center bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                  <span className="text-gray-700 text-sm sm:text-base font-semibold">Saturday</span>
                  <span className="text-emerald-700 font-bold text-sm sm:text-base">9:00 AM - 1:00 PM</span>
                </div>
                <div className="flex justify-between items-center bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <span className="text-gray-700 text-sm sm:text-base font-semibold">Sunday</span>
                  <span className="text-gray-500 font-bold text-sm sm:text-base">Closed</span>
                </div>
              </div>
              
              <div className="border-t-2 border-gray-200 pt-6 sm:pt-8 mt-6 sm:mt-8">
                <h3 className="text-2xl sm:text-3xl font-extrabold bg-gradient-to-r from-teal-700 to-emerald-700 bg-clip-text text-transparent mb-4 sm:mb-5">Our Location</h3>
                <p className="text-gray-700 mb-4 text-base sm:text-lg leading-relaxed font-medium">
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