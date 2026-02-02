"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Home, UtensilsCrossed, ShoppingCart, Settings2 } from "lucide-react";
import { useCartStore } from "@/store/cart-store";
import { cn } from "@/lib/utils";
import { useState, useEffect, useRef } from "react";

type NavItem = {
  href?: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  active: boolean;
  badge?: number;
  onClick?: () => void;
};

interface MobileNavProps {
  cartOpen: boolean;
  onCartOpenChange: (open: boolean) => void;
}

export function MobileNav({ cartOpen, onCartOpenChange }: MobileNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const itemCount = useCartStore((s) => s.count());
  const [isVisible, setIsVisible] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const lastScrollY = useRef(0);
  const ticking = useRef(false);

  // ✅ Fix hydration: wait for client-side mount
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // ✅ Hide nav when cart is open
  useEffect(() => {
    if (cartOpen) {
      setIsVisible(false);
    }
  }, [cartOpen]);

  useEffect(() => {
    const handleScroll = () => {
      if (!ticking.current) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;
          
          // Show nav when scrolling up or at top
          if (currentScrollY < lastScrollY.current || currentScrollY < 50) {
            setIsVisible(true);
          } 
          // Hide nav when scrolling down (after 50px)
          else if (currentScrollY > 50 && currentScrollY > lastScrollY.current) {
            setIsVisible(false);
          }
          
          lastScrollY.current = currentScrollY;
          ticking.current = false;
        });
        
        ticking.current = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const navItems: NavItem[] = [
    {
      href: "/",
      label: "Home",
      icon: Home,
      active: pathname === "/",
    },
    {
      href: "/menu",
      label: "Menu",
      icon: UtensilsCrossed,
      active: pathname.startsWith("/menu"),
    },
    {
      // ✅ Cart opens drawer, not navigation
      label: "Cart",
      icon: ShoppingCart,
      active: cartOpen,
      badge: itemCount > 0 ? itemCount : undefined,
      onClick: () => {
        onCartOpenChange(true);
      },
    },
    {
      href: "/profile",
      label: "Settings",
      icon: Settings2,
      active: pathname === "/profile",
    },
  ];

  // ✅ Hide nav on specific routes
  const hiddenRoutes = ["/order/success", "/login", "/onboarding", "/cart", "/checkout"];
  if (hiddenRoutes.some((route) => pathname.startsWith(route))) {
    return null;
  }

  return (
    <>
      {/* Mobile Bottom Navigation - iPhone Safari Style */}
      <nav 
        className={cn(
          "fixed left-0 right-0 z-50 md:hidden border-t bg-background/95 backdrop-blur-xl supports-[backdrop-filter]:bg-background/95 transition-all duration-300 ease-in-out",
          isVisible ? "bottom-0" : "-bottom-24"
        )}
      >
        <div className="flex items-center justify-around h-16 px-2 max-w-md mx-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            
            if (item.href) {
              // Render as Link
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={item.onClick}
                  className={cn(
                    "relative flex flex-col items-center justify-center gap-0.5 px-4 py-2 rounded-2xl transition-all duration-200 min-w-[64px] active:scale-95",
                    item.active
                      ? "text-primary scale-105"
                      : "text-muted-foreground hover:text-foreground hover:scale-105"
                  )}
                  aria-label={item.label}
                  aria-current={item.active ? "page" : undefined}
                >
                  {/* Icon Container with Badge */}
                  <div className="relative">
                    <div className={cn(
                      "flex items-center justify-center w-10 h-10 rounded-2xl transition-all duration-200",
                      item.active 
                        ? "bg-primary/10" 
                        : "bg-transparent"
                    )}>
                      <Icon className={cn(
                        "transition-all duration-200",
                        item.active ? "h-6 w-6" : "h-5 w-5"
                      )} />
                    </div>
                    
                    {/* Badge - only after hydration */}
                    {isMounted && item.badge && (
                      <span 
                        className="absolute -top-1 -right-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground px-1 shadow-lg animate-in zoom-in-50 duration-200"
                        aria-label={`${item.badge} items in cart`}
                      >
                        {item.badge > 9 ? "9+" : item.badge}
                      </span>
                    )}
                  </div>
                  
                  {/* Label */}
                  <span className={cn(
                    "text-[10px] font-medium transition-all duration-200",
                    item.active ? "opacity-100 font-semibold" : "opacity-70"
                  )}>
                    {item.label}
                  </span>
                  
                  {/* Active Indicator */}
                  {item.active && (
                    <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary animate-in fade-in zoom-in-50 duration-200" />
                  )}
                </Link>
              );
            } else {
              // Render as button
              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={item.onClick}
                  className={cn(
                    "relative flex flex-col items-center justify-center gap-0.5 px-4 py-2 rounded-2xl transition-all duration-200 min-w-[64px] active:scale-95",
                    item.active
                      ? "text-primary scale-105"
                      : "text-muted-foreground hover:text-foreground hover:scale-105"
                  )}
                  aria-label={item.label}
                  aria-current={item.active ? "page" : undefined}
                >
                  {/* Icon Container with Badge */}
                  <div className="relative">
                    <div className={cn(
                      "flex items-center justify-center w-10 h-10 rounded-2xl transition-all duration-200",
                      item.active 
                        ? "bg-primary/10" 
                        : "bg-transparent"
                    )}>
                      <Icon className={cn(
                        "transition-all duration-200",
                        item.active ? "h-6 w-6" : "h-5 w-5"
                      )} />
                    </div>
                    
                    {/* Badge - only after hydration */}
                    {isMounted && item.badge && (
                      <span 
                        className="absolute -top-1 -right-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground px-1 shadow-lg animate-in zoom-in-50 duration-200"
                        aria-label={`${item.badge} items in cart`}
                      >
                        {item.badge > 9 ? "9+" : item.badge}
                      </span>
                    )}
                  </div>
                  
                  {/* Label */}
                  <span className={cn(
                    "text-[10px] font-medium transition-all duration-200",
                    item.active ? "opacity-100 font-semibold" : "opacity-70"
                  )}>
                    {item.label}
                  </span>
                  
                  {/* Active Indicator */}
                  {item.active && (
                    <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary animate-in fade-in zoom-in-50 duration-200" />
                  )}
                </button>
              );
            }
          })}
        </div>
        
        {/* Safe area padding for devices with notch */}
        <div className="h-[env(safe-area-inset-bottom)] bg-background" />
      </nav>
    </>
  );
}
