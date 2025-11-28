"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSession } from "next-auth/react";
import {
  Menu,
  X,
  ShoppingCart,
  Heart,
  User,
  Search,
  HelpCircle,
  ArrowLeftFromLine,
  PersonStandingIcon,
  User2,
  Settings,
} from "lucide-react";
import { cartService } from "@/lib/cart";
import { useStore } from "@/components/StoreProvider";
import resolveImageUrl from "@/lib/image";

export function Navbar() {
  const { data: session } = useSession();
  const { store, isLoading } = useStore();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [cartItemCount, setCartItemCount] = useState(0);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  useEffect(() => {
    setCartItemCount(cartService.getItemCount());

    const handleStorageChange = () => {
      setCartItemCount(cartService.getItemCount());
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  if (isLoading || !store) {
    return (
      <nav className="bg-white shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="animate-pulse bg-gray-300 h-8 w-32 rounded"></div>
            <div className="animate-pulse bg-gray-300 h-8 w-64 rounded"></div>
          </div>
        </div>
      </nav>
    );
  }

  const navigation = [
    {
      name: "",
      href: "/cart",
      icon: ShoppingCart,
      badge: cartItemCount,
      key: "cart",
    },
    { name: "", href: "/favorites", icon: Heart, key: "favorites" },
    { name: "", href: "/support", icon: HelpCircle, key: "support" },
    { name: "Tienda", href: "/products", key: "products" },
  ];

  // Mobile navigation excludes cart and favorites (they're in the navbar)
  const mobileNavigation = [
    { name: "Tienda", href: "/products", key: "mobile-products" },
    {
      name: "Soporte",
      href: "/support",
      icon: HelpCircle,
      key: "mobile-support",
    },
  ];

  const handleAccountMenuToggle = () => setIsAccountMenuOpen((prev) => !prev);
  const handleLogout = async () => {
    const { signOut } = await import("next-auth/react");
    signOut({ callbackUrl: "/auth/signin" });
    setIsAccountMenuOpen(false);
  };

  return (
    <nav
      className="shadow-lg sticky top-0 z-50"
      style={{ backgroundColor: store.primaryColor }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0 flex items-center">
              {store.logoUrl ? (
                <Image
                  src={resolveImageUrl(store.logoUrl)}
                  alt={store.name}
                  width={190}
                  height={80}
                  className="h-8 w-auto"
                />
              ) : (
                <span
                  className="text-2xl font-bold font-montserrat"
                  style={{ color: store.textColor }}
                >
                  {store.name}
                </span>
              )}
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-0">
            {navigation.map((item) => (
              <Link
                key={item.key}
                href={item.href}
                className="flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors relative hover:opacity-80"
                style={{
                  color: store.textColor,
                }}
              >
                {item.icon && <item.icon className="w-5 h-5 mr-1" />}
                {item.name}
                {item.badge && item.badge > 0 && (
                  <span
                    className="absolute -top-1 -right-1 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center"
                    style={{ backgroundColor: store.accentColor }}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            ))}

            {/* User Menu with Dropdown */}
            <div className="relative flex items-center">
              {session ? (
                <>
                  <button
                    onClick={handleAccountMenuToggle}
                    className="flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors hover:opacity-80 focus:outline-none"
                    style={{ color: store.textColor }}
                  >
                    <User className="w-5 h-5 mr-1" />
                    Mi Cuenta
                    <svg
                      className={`ml-2 w-4 h-4 transition-transform duration-200 ${
                        isAccountMenuOpen ? "rotate-180" : ""
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>
                  <div
                    className={`absolute right-0 top-8 mt-2 w-56 min-w-max bg-white border border-gray-200 rounded-xl shadow-2xl z-50 transition-all duration-200 ${
                      isAccountMenuOpen
                        ? "opacity-100 translate-y-2 pointer-events-auto"
                        : "opacity-0 -translate-y-2 pointer-events-none"
                    }`}
                    style={{
                      boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                      padding: "0.75rem 0",
                    }}
                  >
                    <Link
                      href="/perfil"
                      className="block px-6 py-3 text-gray-700 hover:bg-gray-100 transition-colors text-base rounded-t-xl"
                      onClick={() => setIsAccountMenuOpen(false)}
                    >
                      <User2 className="inline-block mr-2" />
                      Perfil
                    </Link>

                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-6 py-3 text-red-600 hover:bg-gray-100 transition-colors text-base rounded-b-xl"
                    >
                      Cerrar sesión
                    </button>
                  </div>
                  {/* Overlay to close dropdown when clicking outside */}
                  {isAccountMenuOpen && (
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setIsAccountMenuOpen(false)}
                      style={{ background: "transparent" }}
                    />
                  )}
                </>
              ) : (
                <Link
                  href="/auth/signin"
                  className="px-4 py-2 rounded-md text-sm font-medium transition-colors text-white hover:opacity-90"
                  style={{ backgroundColor: store.primaryColor }}
                >
                  Iniciar Sesión
                </Link>
              )}
            </div>
          </div>

          {/* Mobile menu button and icons */}
          <div className="lg:hidden flex items-center space-x-4">
            {/* Cart Icon */}
            <Link
              href="/cart"
              className="relative transition-colors"
              style={{ color: store.textColor }}
            >
              <ShoppingCart className="w-6 h-6" />
              {cartItemCount > 0 && (
                <span
                  className="absolute -top-1 -right-1 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center"
                  style={{ backgroundColor: store.accentColor }}
                >
                  {cartItemCount}
                </span>
              )}
            </Link>

            {/* Heart Icon */}
            <Link
              href="/favorites"
              className="relative transition-colors"
              style={{ color: store.textColor }}
            >
              <Heart className="w-6 h-6" />
            </Link>

            {/* Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className=" focus:outline-none "
              style={{ color: store.textColor }}
            >
              {isMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="lg:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 bg-white border-t">
              {mobileNavigation.map((item) => (
                <Link
                  key={item.key}
                  href={item.href}
                  className="flex items-center text-gray-700  hover:bg-gray-50 px-3 py-2 rounded-md text-base font-medium"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.icon && <item.icon className="w-5 h-5 mr-2" />}
                  {item.name}
                </Link>
              ))}

              <div className="border-t pt-4">
                {session ? (
                  <div className="relative">
                    <button
                      onClick={handleAccountMenuToggle}
                      className="flex items-center text-gray-700 hover:text-blue-600 hover:bg-gray-50 px-3 py-2 rounded-md text-base font-medium w-full text-left focus:outline-none"
                    >
                      <User className="w-5 h-5 mr-2" />
                      Mi Cuenta
                    </button>
                    {isAccountMenuOpen && (
                      <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-50">
                        <Link
                          href="/user"
                          className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                          onClick={() => {
                            setIsAccountMenuOpen(false);
                            setIsMenuOpen(false);
                          }}
                        >
                          Perfil
                        </Link>
                        <button
                          onClick={() => {
                            handleLogout();
                            setIsMenuOpen(false);
                          }}
                          className="block w-full text-left px-4 py-2 text-red-600 hover:bg-gray-100 flex items-center space-x-2"
                        >
                          <ArrowLeftFromLine />
                          Cerrar sesión
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <Link
                    href="/auth/signin"
                    className="block w-full text-center text-white px-4 py-2 rounded-md text-base font-mediumtransition-colors"
                    style={{ backgroundColor: store.primaryColor }}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Iniciar Sesión
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
