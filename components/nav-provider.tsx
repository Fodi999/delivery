"use client";

import { useState } from "react";
import { MobileNav } from "./mobile-nav";
import { CartDrawer } from "./cart/cart-drawer";

export function NavProvider() {
  const [cartOpen, setCartOpen] = useState(false);

  return (
    <>
      <MobileNav cartOpen={cartOpen} onCartOpenChange={setCartOpen} />
      <CartDrawer open={cartOpen} onOpenChange={setCartOpen} />
    </>
  );
}
