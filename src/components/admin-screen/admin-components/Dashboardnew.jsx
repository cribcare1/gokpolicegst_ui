import { useState, useEffect } from 'react';
import {LOGIN_CONSTANT} from "@/components/utils/constant"
import { useNetworkStatus } from '@/components/utils/network';


export default function StatisticsDisplay() {
  const [isAnimated, setIsAnimated] = useState(false);
  const [activeSlice, setActiveSlice] = useState(null);

  const [ddoCount, setDdoCount] = useState(0);
  const [form16Count, setForm16Count] = useState(0);
  const [form16ACount, setForm16ACount] = useState(0); 
  const isOnline = useNetworkStatus();

  const parseStoredNumber = (key) => {
    const value = localStorage.getItem(key);
    if (value === null) return 0;
    const parsed = Number(value);
    return isNaN(parsed) ? 0 : parsed;
  };
  const [windowWidth, setWindowWidth] = useState(typeof window !== "undefined" ? window.innerWidth : 0);  
  useEffect(() => {
    // Set initial width
   
    if (typeof window !== "undefined") {
    setDdoCount(parseStoredNumber(LOGIN_CONSTANT.DDO_COUNT));
    setForm16Count(parseStoredNumber(LOGIN_CONSTANT.FORM_16_COUNT));
    setForm16ACount(parseStoredNumber(LOGIN_CONSTANT.FORM_16A_COUNT));
    }
    // Update width on resize
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    
    window.addEventListener('resize', handleResize);
    
    // Trigger animation after component mounts
    setTimeout(() => {
      setIsAnimated(true);
    }, 300);
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Updated color theme to match the image
  const themeColors = {
    primary: 'green', // Main green from NPS score
    secondary: '#FFC72C', // Yellow from pie charts
    tertiary: 'red', // Orange from pie charts
    danger: '#FF5252', // Red from pie charts
    background: '#F5F7F9', // Light gray background
    card: '#FFFFFF', // White card background
    text: '#2D3748', // Dark text
    lightText: '#718096', // Light text
  };
  
  // Data for stats cards
  const statsData = [
    { name: 'No of DDO', value: ddoCount, icon: '🧔‍♂️', color: 'primary' },
    { name: 'No of Form16', value: form16Count, icon: '📝', color: 'secondary' },
    { name: 'No of Form16A', value: form16ACount, icon: '📄', color: 'tertiary' }
  ];
  
  // Data for pie chart
  const pieData = [
    { name: 'DDO', value: ddoCount, color: themeColors.primary }, // Green
    { name: 'Form16', value: form16Count, color: themeColors.secondary }, // Yellow 
    { name: 'Form16A', value: form16ACount, color: themeColors.tertiary }, // Orange
  ];
  
  // Calculate percentages and angles for pie chart
  const total = pieData.reduce((sum, item) => sum + item.value, 0);
  let currentAngle = 0;
  
  const pieSlices = pieData.map((item, index) => {
    const percentage = (item.value / total) * 100;
    const startAngle = currentAngle;
    const angle = (percentage / 100) * 360;
    const endAngle = startAngle + angle;
    currentAngle = endAngle;
    
    return {
      ...item,
      percentage,
      startAngle,
      endAngle
    };
  });
  
  // Function to create SVG arc path
  const createArcPath = (startAngle, endAngle, innerRadius, outerRadius, centerX, centerY) => {
    // Convert angles from degrees to radians
    const startRad = (startAngle - 90) * (Math.PI / 180);
    const endRad = (endAngle - 90) * (Math.PI / 180);
    
    // Calculate start and end points
    const startOuterX = centerX + outerRadius * Math.cos(startRad);
    const startOuterY = centerY + outerRadius * Math.sin(startRad);
    const endOuterX = centerX + outerRadius * Math.cos(endRad);
    const endOuterY = centerY + outerRadius * Math.sin(endRad);
    
    const startInnerX = centerX + innerRadius * Math.cos(endRad);
    const startInnerY = centerY + innerRadius * Math.sin(endRad);
    const endInnerX = centerX + innerRadius * Math.cos(startRad);
    const endInnerY = centerY + innerRadius * Math.sin(startRad);
    
    // Create the arc path
    const largeArcFlag = endAngle - startAngle <= 180 ? 0 : 1;
    
    // Outer arc
    let path = `M ${startOuterX} ${startOuterY} `;
    path += `A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${endOuterX} ${endOuterY} `;
    
    // Line to inner arc
    path += `L ${startInnerX} ${startInnerY} `;
    
    // Inner arc
    path += `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${endInnerX} ${endInnerY} `;
    
    // Close path
    path += 'Z';
    
    return path;
  };
  
  // Updated color mapping for stat cards
  const getCardStyle = (colorName) => {
    const styles = {
      primary: {
        bg: 'bg-white',
        text: 'text-green-600',
        border: 'border-green-200',
        icon: 'text-green-500',
        progress: 'bg-green-500',
      },
      secondary: {
        bg: 'bg-white',
        text: 'text-yellow-600',
        border: 'border-yellow-200',
        icon: 'text-yellow-500',
        progress: 'bg-yellow-500',
      },
      tertiary: {
        bg: 'bg-white',
        text: 'text-orange-600',
        border: 'border-orange-200',
        icon: 'text-orange-500',
        progress: 'bg-orange-500',
      },
    };
    return styles[colorName];
  };
  
  const isSmallScreen = windowWidth < 768;
  
  // Size config for pie chart
  const svgSize = isSmallScreen ? 260 : 300;
  const centerX = svgSize / 2;
  const centerY = svgSize / 2;
  const outerRadius = isSmallScreen ? 100 : 120;
  const innerRadius = isSmallScreen ? 60 : 70;

  if(!isOnline){
    return (<div><p className="text-red-600">Oops! It looks like you're offline. We'll reconnect once you're back online.❌</p></div>);
   }
  
  return (
    <div className="w-full p-6 bg-gray-100 rounded-xl shadow-lg">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Form Statistics</h2>
      
      <div className={`flex ${isSmallScreen ? 'flex-col space-y-6' : 'flex-row space-x-6'} justify-around items-stretch mb-8`}>
        {statsData.map((item, index) => {
          const style = getCardStyle(item.color);
          return (
            <div 
              key={item.name}
              className={`${style.bg} ${style.border} relative overflow-hidden border rounded-xl py-6 px-6 flex flex-col items-center justify-center shadow-md w-full transition-all duration-500 hover:shadow-xl ${isAnimated ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
              style={{ transitionDelay: `${index * 150}ms` }}
            >
              <div className={`absolute top-3 right-4 text-2xl ${style.icon}`}>{item.icon}</div>
              <p className="text-lg font-medium text-gray-600">{item.name}</p>
              <p className={`text-4xl font-bold ${style.text} mt-2`}>{item.value}</p>
              <div className={`h-2 w-16 ${style.progress} mt-4 rounded-full`}></div>
            </div>
          );
        })}
      </div>
      
      <div className={`mt-8 bg-white rounded-xl shadow-md p-6 transition-all duration-700 ${isAnimated ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
        <h3 className="text-xl font-bold text-gray-800 mb-4 text-center">Distribution of Forms</h3>
        
        <div className="flex flex-col md:flex-row items-center justify-center">
          {/* SVG Pie Chart */}
          <div className="relative">
            <svg width={svgSize} height={svgSize} viewBox={`0 0 ${svgSize} ${svgSize}`}>
              {/* Outer ring - light gray background */}
              <circle 
                cx={centerX} 
                cy={centerY} 
                r={outerRadius} 
                fill="none" 
                stroke="#E2E8F0" 
                strokeWidth="10" 
              />
              {pieSlices.map((slice, index) => {
                const path = createArcPath(
                  slice.startAngle, 
                  slice.endAngle, 
                  innerRadius, 
                  activeSlice === index ? outerRadius + 5 : outerRadius, 
                  centerX, 
                  centerY
                );
                
                return (
                  <path
                    key={slice.name}
                    d={path}
                    fill={slice.color}
                    stroke="#fff"
                    strokeWidth="2"
                    onMouseEnter={() => setActiveSlice(index)}
                    onMouseLeave={() => setActiveSlice(null)}
                    className="transition-all duration-300"
                  />
                );
              })}
              {/* Inner circle */}
              <circle 
                cx={centerX} 
                cy={centerY} 
                r={innerRadius - 10} 
                fill="white" 
                stroke="#E2E8F0"
                strokeWidth="1"
              />
              
              {/* Center text */}
              {activeSlice !== null && (
  <text 
    x={centerX} 
    y={centerY} 
    textAnchor="middle" 
    dominantBaseline="middle" 
    className="text-xl font-bold fill-gray-700"
  >
    {pieData[activeSlice].value}
  </text>
)}

              
            </svg>
          </div>
          
          {/* Stats with colored bars */}
          <div className="mt-6 md:mt-0 md:ml-8 w-full max-w-xs">
            {pieData.map((item) => {
              const percentage = total>0?Math.round((item.value / total) * 100):0;
              return (
                <div key={item.name} className="mb-4">
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">{item.name}</span>
                    <span className="text-sm font-medium text-gray-500">{item.value}</span>

                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div 
                      className="h-2.5 rounded-full" 
                      style={{
                        width: `${percentage}%`,
                        backgroundColor: item.color
                      }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      
      <div className="mt-6 text-center text-sm text-gray-500">
        Last updated: {new Date().toLocaleDateString()}
      </div>
    </div>
  );
}