'use client';
import AboutUs from "@/components/Aboutus";
import ContactUs from "@/components/Contactus";
import HeroCarousel from "@/components/hero"
import ScrollToTop from "@/components/ScrollToTop";

export default function layout({children}) {
  return (
    <div>
        {children}
        <HeroCarousel/>
        <AboutUs/>
        <ContactUs/>
        <ScrollToTop/>
        </div>
  )
};