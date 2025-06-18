import React, { createContext, useContext, useEffect, useState } from 'react';

export type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  isTransitioning: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>('light');
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Initialize theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('dapps_theme') as Theme;
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    const initialTheme = savedTheme || systemTheme;
    
    setThemeState(initialTheme);
    applyTheme(initialTheme, false);
  }, []);

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      const savedTheme = localStorage.getItem('dapps_theme');
      if (!savedTheme) {
        // Only follow system preference if user hasn't manually set a theme
        const newTheme = e.matches ? 'dark' : 'light';
        setThemeState(newTheme);
        applyTheme(newTheme, true);
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const applyTheme = (newTheme: Theme, animate: boolean = true) => {
    if (animate) {
      setIsTransitioning(true);
      
      // Add smooth transition class to body
      document.body.classList.add('theme-transitioning');
      
      // Create amazing transition effect
      createThemeTransitionEffect(newTheme);
    }

    // Apply or remove dark class
    const html = document.documentElement;
    if (newTheme === 'dark') {
      html.classList.add('dark');
    } else {
      html.classList.remove('dark');
    }

    // Update meta theme-color for mobile browsers
    updateMetaThemeColor(newTheme);

    if (animate) {
      // Remove transition class after animation completes
      setTimeout(() => {
        document.body.classList.remove('theme-transitioning');
        setIsTransitioning(false);
      }, 750);
    }
  };

  const createThemeTransitionEffect = (newTheme: Theme) => {
    // Create main overlay element with enhanced styling
    const overlay = document.createElement('div');
    overlay.className = 'theme-transition-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      pointer-events: none;
      z-index: 999999;
      background: ${newTheme === 'dark' 
        ? 'radial-gradient(circle at center, #1e293b 0%, #0f172a 40%, #020617 100%)'
        : 'radial-gradient(circle at center, #ffffff 0%, #f1f5f9 40%, #e2e8f0 100%)'
      };
      opacity: 0;
      transition: all 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94);
      backdrop-filter: blur(20px);
    `;

    // Create ripple effect starting from center
    createRippleEffect(overlay, newTheme);
    
    // Add enhanced magical particles
    createEnhancedParticles(overlay, newTheme);
    
    // Add floating icons effect
    createFloatingIcons(overlay, newTheme);
    
    // Add color wave animation
    createColorWave(overlay, newTheme);

    document.body.appendChild(overlay);

    // Multi-stage animation sequence
    requestAnimationFrame(() => {
      overlay.style.opacity = '1';
      overlay.style.transform = 'scale(1.02)';
    });

    // Peak animation at 300ms
    setTimeout(() => {
      overlay.style.transform = 'scale(1)';
      overlay.style.filter = 'blur(2px)';
    }, 300);

    // Start fade out at 500ms
    setTimeout(() => {
      overlay.style.opacity = '0';
      overlay.style.transform = 'scale(0.98)';
      overlay.style.filter = 'blur(10px)';
      
      setTimeout(() => {
        if (document.body.contains(overlay)) {
          document.body.removeChild(overlay);
        }
      }, 600);
    }, 500);
  };

  const createRippleEffect = (container: HTMLElement, theme: Theme) => {
    const rippleCount = 5;
    const isDark = theme === 'dark';
    
    for (let i = 0; i < rippleCount; i++) {
      const ripple = document.createElement('div');
      ripple.style.cssText = `
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 20px;
        height: 20px;
        border: 2px solid ${isDark ? '#60a5fa' : '#3b82f6'};
        border-radius: 50%;
        opacity: 0.8;
        animation: ripple-expand 1.2s ease-out forwards;
        animation-delay: ${i * 0.15}s;
      `;
      container.appendChild(ripple);
    }
  };

  const createEnhancedParticles = (container: HTMLElement, theme: Theme) => {
    const particleCount = 50;
    const isDark = theme === 'dark';

    for (let i = 0; i < particleCount; i++) {
      const particle = document.createElement('div');
      const size = Math.random() * 8 + 3;
      const hue = isDark ? 220 + Math.random() * 80 : 200 + Math.random() * 80;
      
      particle.style.cssText = `
        position: absolute;
        width: ${size}px;
        height: ${size}px;
        background: hsl(${hue}, 80%, ${isDark ? 60 + Math.random() * 30 : 40 + Math.random() * 30}%);
        border-radius: 50%;
        left: ${Math.random() * 100}%;
        top: ${Math.random() * 100}%;
        opacity: 0;
        transform: scale(0) rotate(0deg);
        animation: enhanced-particle-float 1.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
        animation-delay: ${Math.random() * 0.8}s;
        box-shadow: 0 0 ${size * 2}px currentColor, 0 0 ${size * 4}px currentColor;
        filter: blur(0.5px);
      `;

      container.appendChild(particle);
    }
  };

  const createFloatingIcons = (container: HTMLElement, theme: Theme) => {
    const icons = theme === 'dark' ? ['🌙', '✨', '🌟', '💫', '🌌'] : ['☀️', '🌞', '🌻', '🌈', '⭐'];
    
    for (let i = 0; i < 8; i++) {
      const icon = document.createElement('div');
      icon.textContent = icons[Math.floor(Math.random() * icons.length)];
      icon.style.cssText = `
        position: absolute;
        font-size: ${20 + Math.random() * 20}px;
        left: ${Math.random() * 100}%;
        top: ${Math.random() * 100}%;
        opacity: 0;
        transform: scale(0) rotate(0deg);
        animation: floating-icon 2s ease-out forwards;
        animation-delay: ${Math.random() * 0.6}s;
        pointer-events: none;
        text-shadow: 0 0 10px rgba(255, 255, 255, 0.8);
      `;
      container.appendChild(icon);
    }
  };

  const createColorWave = (container: HTMLElement, theme: Theme) => {
    const wave = document.createElement('div');
    const isDark = theme === 'dark';
    
    wave.style.cssText = `
      position: absolute;
      top: 0;
      left: -100%;
      width: 300%;
      height: 100%;
      background: ${isDark 
        ? 'linear-gradient(90deg, transparent, rgba(59, 130, 246, 0.3), rgba(147, 51, 234, 0.3), transparent)'
        : 'linear-gradient(90deg, transparent, rgba(251, 191, 36, 0.3), rgba(59, 130, 246, 0.3), transparent)'
      };
      animation: color-wave 1.2s ease-in-out forwards;
      pointer-events: none;
    `;
    
    container.appendChild(wave);
  };

  const updateMetaThemeColor = (theme: Theme) => {
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', theme === 'dark' ? '#0f172a' : '#ffffff');
    } else {
      const meta = document.createElement('meta');
      meta.name = 'theme-color';
      meta.content = theme === 'dark' ? '#0f172a' : '#ffffff';
      document.head.appendChild(meta);
    }
  };

  const setTheme = (newTheme: Theme) => {
    if (newTheme === theme) return;
    
    setThemeState(newTheme);
    localStorage.setItem('dapps_theme', newTheme);
    applyTheme(newTheme);
  };

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme, isTransitioning }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Add smooth transition styles to globals.css
const addThemeTransitionStyles = () => {
  if (!document.getElementById('theme-transition-styles')) {
    const style = document.createElement('style');
    style.id = 'theme-transition-styles';
    style.textContent = `
      .theme-transitioning * {
        transition: background-color 0.3s cubic-bezier(0.4, 0, 0.2, 1),
                    border-color 0.3s cubic-bezier(0.4, 0, 0.2, 1),
                    color 0.3s cubic-bezier(0.4, 0, 0.2, 1),
                    box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
      }
      
      .theme-transitioning *:before,
      .theme-transitioning *:after {
        transition: background-color 0.3s cubic-bezier(0.4, 0, 0.2, 1),
                    border-color 0.3s cubic-bezier(0.4, 0, 0.2, 1),
                    color 0.3s cubic-bezier(0.4, 0, 0.2, 1),
                    box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
      }
      
      .theme-transitioning svg {
        transition: fill 0.3s cubic-bezier(0.4, 0, 0.2, 1),
                    stroke 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
      }
    `;
    document.head.appendChild(style);
  }
};

// Add styles when component mounts
addThemeTransitionStyles(); 