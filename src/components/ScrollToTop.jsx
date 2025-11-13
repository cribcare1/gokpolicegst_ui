"use client";
import { useEffect, useState, memo } from "react";
import { ChevronUp } from "lucide-react"; // or any icon you like

const ScrollToTop = memo(function ScrollToTop() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      setIsVisible(window.scrollY > 300);
    };

    window.addEventListener("scroll", toggleVisibility);
    return () => window.removeEventListener("scroll", toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    isVisible && (
      <button
        onClick={scrollToTop}
        className="fixed bottom-6 right-6 z-50 p-4 rounded-full bg-gradient-to-r from-blue-500 to-blue-700 text-white shadow-lg hover:scale-110 transition-transform duration-300"
        aria-label="Scroll to top"
      >
        <ChevronUp size={24} />
      </button>
    )
  );
});

ScrollToTop.displayName = 'ScrollToTop';

export default ScrollToTop;
