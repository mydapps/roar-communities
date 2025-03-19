
import * as React from "react"

const MOBILE_BREAKPOINT = 768
const TABLET_BREAKPOINT = 1024

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean>(
    typeof window !== 'undefined' ? window.innerWidth < MOBILE_BREAKPOINT : false
  )

  React.useEffect(() => {
    if (typeof window === 'undefined') return
    
    const handleResize = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    
    window.addEventListener('resize', handleResize)
    handleResize() // Set initial value
    
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return isMobile
}

export function useIsTablet() {
  const [isTablet, setIsTablet] = React.useState<boolean>(
    typeof window !== 'undefined' 
      ? window.innerWidth >= MOBILE_BREAKPOINT && window.innerWidth < TABLET_BREAKPOINT 
      : false
  )

  React.useEffect(() => {
    if (typeof window === 'undefined') return
    
    const handleResize = () => {
      setIsTablet(
        window.innerWidth >= MOBILE_BREAKPOINT && window.innerWidth < TABLET_BREAKPOINT
      )
    }
    
    window.addEventListener('resize', handleResize)
    handleResize() // Set initial value
    
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return isTablet
}
