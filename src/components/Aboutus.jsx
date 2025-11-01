import { useState, useEffect } from 'react';
import { Users, Award, Calendar, Building, Check, ArrowRight, BookOpen, Star } from 'lucide-react';

export default function AboutUs() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    handleResize();
    
    window.addEventListener('resize', handleResize);
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
<div id="aboutus" className="bg-gradient-to-br from-slate-50 via-teal-50 to-emerald-50 min-h-screen py-16 px-4 md:px-8 overflow-x-hidden relative">
{/* Decorative elements with adjusted positioning to prevent overflow */}
      <div className="fixed top-0 right-0 w-64 h-64 bg-teal-200 rounded-full opacity-20 blur-3xl"></div>
      <div className="fixed bottom-0 left-0 w-64 h-64 bg-emerald-200 rounded-full opacity-20 blur-3xl"></div>
      
      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header Section with Animation */}
        <div className="text-center mb-12 md:mb-16 relative">
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-40 h-1 bg-teal-100"></div>
          <div className="inline-block p-4 bg-white shadow-lg rounded-full mb-6 border-4 border-teal-50">
            <Building className="h-10 w-10 sm:h-12 sm:w-12 text-teal-600" />
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-800 mb-4 md:mb-6 relative">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-teal-600 to-emerald-600">
              ABOUT WINGS e-BUSINESS SERVICES
            </span>
            <span className="block text-xl sm:text-2xl md:text-3xl font-semibold mt-2">(WEBS)</span>
          </h1>
          <div className="w-24 h-1 bg-gradient-to-r from-teal-500 to-emerald-500 mx-auto mb-4 md:mb-6"></div>
          <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto px-4">
            Delivering excellence in tax compliance services since 2006
          </p>
        </div>

        {/* Main Content Card with Design Enhancements */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden mb-12 md:mb-16 border border-teal-100/50 hover:shadow-3xl transition-all duration-500 transform hover:-translate-y-1">
          {/* Decorative top border */}
          <div className="h-1.5 bg-gradient-to-r from-teal-500 via-emerald-500 to-cyan-500"></div>
          <div className="md:flex flex-col md:flex-row">
            <div className="md:w-1/3 bg-gradient-to-br from-teal-500 via-emerald-500 to-cyan-500 text-white p-8 md:p-10 flex flex-col justify-center items-center relative overflow-hidden">
              {/* Pattern overlay */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute inset-0" style={{backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '20px 20px'}}></div>
              </div>
              <div className="text-center relative z-10">
                <div className="inline-block p-4 bg-white/20 rounded-2xl mb-6 backdrop-blur-sm shadow-xl">
                  <Star className="h-10 w-10 sm:h-12 sm:w-12 text-white" />
                </div>
                <h3 className="text-2xl sm:text-3xl font-extrabold mb-3 tracking-tight">Est. 2006</h3>
                <p className="opacity-95 text-base sm:text-lg font-medium mb-6">Leading in Tax Compliance</p>
                <div className="mt-6 pt-6 border-t border-white/30">
                  <p className="font-bold text-base sm:text-lg tracking-wide">License No. TINFC-03261</p>
                </div>
              </div>
            </div>
            <div className="md:w-2/3 p-8 sm:p-10 md:p-12">
              <div className="space-y-6">
                <p className="text-gray-700 leading-relaxed text-base sm:text-lg font-normal">
                  <span className="font-semibold text-teal-700">M/s Wings e-Business Services (WEBS)</span>, a proprietorship firm based in Bangalore, has been a leader in providing Income Tax-TDS and
                  statutory tax compliance services since its inception in 2006. Our company is registered under TINFC with License No. 03261, and we
                  specialize in delivering end-to-end consultancy services in e-tax compliance.
                </p>
                
                <p className="text-gray-700 leading-relaxed text-base sm:text-lg font-normal">
                  We have successfully assisted <span className="font-bold text-emerald-600">over 600 clients</span>, including multinational corporations (MNCs), private companies, public sector undertakings
                  (PSUs), banks, and both government and non-government TDS deductors. Our services range from resolving demand/show-cause notices to
                  handling complex tax disputes.
                </p>
                
                <p className="text-gray-700 leading-relaxed text-base sm:text-lg font-normal">
                  In addition to our consultancy services, we conduct periodic orientation and training programs for Drawing and Disbursing Officers (DDOs)
                  after each financial budget. These sessions are aimed at enhancing the understanding of TDS procedures for both government and non
                  government deductors. Our proprietor, a subject matter expert, also serves as a visiting faculty member at the Direct Taxes Regional
                  Training Institute (DTRTI), the KPTCL HRD Center, the Regional Training Center of PCDA, and the HRD Center at LIC of India, Bengaluru.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Mission Statement with Enhanced Design */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden mb-12 md:mb-16 border border-teal-100/50 relative hover:shadow-3xl transition-all duration-500">
          <div className="h-1.5 bg-gradient-to-r from-teal-500 via-emerald-500 to-cyan-500"></div>
          <div className="absolute top-0 right-0 h-full w-1/3 bg-gradient-to-br from-teal-50 to-emerald-50 clip-path-diagonal hidden md:block opacity-50"></div>
          <div className="p-8 sm:p-10 md:p-12 relative">
            <div className="flex flex-col sm:flex-row items-start sm:items-center mb-8 md:mb-10 gap-6">
              <div className="bg-gradient-to-br from-teal-500 to-emerald-600 p-4 sm:p-5 rounded-2xl shadow-xl transform hover:scale-110 transition-transform duration-300">
                <Award className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
              </div>
              <div>
                <h2 className="text-3xl sm:text-4xl font-extrabold bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent">Our Mission</h2>
                <div className="w-24 h-1 bg-gradient-to-r from-teal-500 to-emerald-500 mt-2"></div>
              </div>
            </div>
            <div className="max-w-3xl">
              <p className="text-gray-700 leading-relaxed text-base sm:text-lg mb-6 md:mb-8 font-normal text-justify">
                Our mission is to provide <span className="font-semibold text-teal-700">timely, accurate, and comprehensive</span> e-TDS consultancy services, combined with training programs that enhance
                the compliance capabilities of organizations. We are committed to ensuring that establishments have the requisite expertise to manage
                Income Tax, GST, and Professional Tax obligations efficiently.
              </p>
              <div className="mt-6 md:mt-8 pt-6 md:pt-8 border-t-2 border-gray-100">
                <div className="flex items-center gap-3 bg-teal-50 p-4 rounded-xl">
                  <div className="bg-teal-500 p-2 rounded-lg">
                    <ArrowRight className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-teal-700 font-bold text-lg">Excellence in every consultation</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Key Features Grid with Animation and Enhanced Design */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          <div className="bg-white p-8 sm:p-10 rounded-3xl shadow-xl text-center border-2 border-teal-50 hover:border-teal-200 transition-all duration-500 transform hover:-translate-y-2 hover:shadow-2xl group relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-teal-500 to-emerald-500"></div>
            <div className="bg-gradient-to-br from-teal-500 to-emerald-600 p-5 sm:p-6 rounded-2xl inline-block mb-6 shadow-xl group-hover:scale-110 transition-transform duration-300">
              <Calendar className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
            </div>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-gray-800 mb-4">Since 2006</h3>
            <p className="text-gray-600 mb-6 text-base sm:text-lg leading-relaxed">Over <span className="font-bold text-teal-600">18 years</span> of excellence in tax compliance services, building trust through expertise and results.</p>
            <div className="pt-6 border-t-2 border-gray-100">
              <div className="flex items-center justify-center gap-2 bg-emerald-50 px-4 py-2 rounded-lg">
                <Check className="h-5 w-5 text-emerald-600" />
                <span className="text-gray-800 font-semibold text-sm sm:text-base">Proven track record</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-8 sm:p-10 rounded-3xl shadow-xl text-center border-2 border-teal-50 hover:border-teal-200 transition-all duration-500 transform hover:-translate-y-2 hover:shadow-2xl group relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-teal-500 to-emerald-500"></div>
            <div className="bg-gradient-to-br from-teal-500 to-emerald-600 p-5 sm:p-6 rounded-2xl inline-block mb-6 shadow-xl group-hover:scale-110 transition-transform duration-300">
              <Users className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
            </div>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-gray-800 mb-4">600+ Clients</h3>
            <p className="text-gray-600 mb-6 text-base sm:text-lg leading-relaxed">Serving diverse organizations including MNCs, PSUs, banks, and government agencies with tailored solutions.</p>
            <div className="pt-6 border-t-2 border-gray-100">
              <div className="flex items-center justify-center gap-2 bg-emerald-50 px-4 py-2 rounded-lg">
                <Check className="h-5 w-5 text-emerald-600" />
                <span className="text-gray-800 font-semibold text-sm sm:text-base">Client satisfaction</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-8 sm:p-10 rounded-3xl shadow-xl text-center border-2 border-teal-50 hover:border-teal-200 transition-all duration-500 transform hover:-translate-y-2 hover:shadow-2xl group relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-teal-500 to-emerald-500"></div>
            <div className="bg-gradient-to-br from-teal-500 to-emerald-600 p-5 sm:p-6 rounded-2xl inline-block mb-6 shadow-xl group-hover:scale-110 transition-transform duration-300">
              <BookOpen className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
            </div>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-gray-800 mb-4">Expert Training</h3>
            <p className="text-gray-600 mb-6 text-base sm:text-lg leading-relaxed">Comprehensive training programs delivered by industry experts, empowering professionals with knowledge.</p>
            <div className="pt-6 border-t-2 border-gray-100">
              <div className="flex items-center justify-center gap-2 bg-emerald-50 px-4 py-2 rounded-lg">
                <Check className="h-5 w-5 text-emerald-600" />
                <span className="text-gray-800 font-semibold text-sm sm:text-base">Knowledge transfer</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Decorative Element at Bottom */}
        <div className="flex justify-center mt-12 md:mt-16">
          <div className="w-16 h-1 bg-gradient-to-r from-teal-500 to-emerald-500"></div>
        </div>
      </div>
      
      <style jsx global>{`
        .clip-path-diagonal {
          clip-path: polygon(100% 0, 100% 100%, 0 100%);
        }
        
        body {
          overflow-x: hidden;
        }
      `}</style>
    </div>
  );
}