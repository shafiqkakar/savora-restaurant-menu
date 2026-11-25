
"use client";

import { useEffect, useMemo, useState } from "react";

interface MenuItem {
  id: number;
  name: string;
  price: string | number;
  description: string;
  image_url?: string | null;
  category?: string | null;
}

interface CartItem {
  menu_item_id: number;
  name: string;
  price: number;
  quantity: number;
  image_url?: string | null;
}

interface ApiResponse {
  success: boolean;
  message?: string;
  menuItems?: MenuItem[];
}

interface OrderResponse {
  success: boolean;
  message?: string;
  orderId?: number;
  totalAmount?: number | string;
}

const photos = {
  hero: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=2000&q=85",
  story: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1100&q=85",
  flavors: "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=900&q=85",
  dining: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=85",
  moments: "https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=900&q=85",
  gallery1: "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=900&q=85",
  gallery2: "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=900&q=85",
  gallery3: "https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?auto=format&fit=crop&w=900&q=85",
  gallery4: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=900&q=85",
};

// Category-based fallback images
const categoryImages: Record<string, string> = {
  burgers:
    "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=900&q=85",
  pizza:
    "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=900&q=85",
  pasta:
    "https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=900&q=85",
  desserts:
    "https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&w=900&q=85",
  drinks:
    "https://images.unsplash.com/photo-1544145945-f90425340c7e?auto=format&fit=crop&w=900&q=85",
  sandwiches:
    "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=900&q=85",
  bbq:
    "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=900&q=85",
  salads:
    "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=900&q=85",
  breakfast:
    "https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?auto=format&fit=crop&w=900&q=85",
};

function getDishImage(item: {
  image_url?: string | null;
  category?: string | null;
}) {
  if (item.image_url?.trim()) {
    return item.image_url;
  }

  const category = item.category?.trim().toLowerCase() || "";

  return categoryImages[category] || photos.gallery3;
}

const highlights = [
  {
    number: "01",
    title: "Thoughtful Flavors",
    description:
      "A menu experience focused on enjoyable flavors and careful presentation.",
    image: photos.flavors,
  },
  {
    number: "02",
    title: "Elegant Dining",
    description:
      "A refined atmosphere designed around the pleasure of dining.",
    image: photos.dining,
  },
  {
    number: "03",
    title: "Memorable Moments",
    description:
      "A place to enjoy good food and make every meal feel special.",
    image: photos.moments,
  },
];

const gallery = [
  { image: photos.gallery1, title: "Fresh Flavors" },
  { image: photos.gallery2, title: "Beautifully Served" },
  { image: photos.gallery3, title: "Made with Care" },
  { image: photos.gallery4, title: "Dining Moments" },
];

export default function Home() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("All");

  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [placingOrder, setPlacingOrder] = useState(false);
  const [orderError, setOrderError] = useState("");
  const [orderSuccess, setOrderSuccess] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function fetchMenu() {
      try {
        setLoading(true);
        const response = await fetch("/api/menu", { cache: "no-store" });
        const data = (await response.json()) as ApiResponse;

        if (!response.ok || !data.success) {
          throw new Error(data.message || "Failed to load menu");
        }

        if (!cancelled) {
          setMenuItems(data.menuItems || []);
          setError("");
        }
      } catch (err) {
        console.error("Fetch menu error:", err);
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Unable to load menu items."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchMenu();

    return () => {
      cancelled = true;
    };
  }, []);

  const categories = useMemo(() => {
    const uniqueCategories = Array.from(
      new Set(
        menuItems.map((item) => item.category?.trim() || "Uncategorized")
      )
    );

    return ["All", ...uniqueCategories.sort((a, b) => a.localeCompare(b))];
  }, [menuItems]);

  const filteredMenuItems = useMemo(() => {
    if (selectedCategory === "All") return menuItems;

    return menuItems.filter(
      (item) =>
        (item.category?.trim() || "Uncategorized") === selectedCategory
    );
  }, [menuItems, selectedCategory]);

  const cartCount = useMemo(
    () => cart.reduce((total, item) => total + item.quantity, 0),
    [cart]
  );

  const cartTotal = useMemo(
    () =>
      cart.reduce((total, item) => total + item.price * item.quantity, 0),
    [cart]
  );

  function addToCart(item: MenuItem) {
    const price = Number(item.price);

    if (!Number.isFinite(price) || price < 0) {
      setOrderError("This menu item's price is currently invalid.");
      return;
    }

    setOrderError("");
    setOrderSuccess("");

    setCart((currentCart) => {
      const existingItem = currentCart.find(
        (cartItem) => cartItem.menu_item_id === item.id
      );

      if (existingItem) {
        return currentCart.map((cartItem) =>
          cartItem.menu_item_id === item.id
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        );
      }

      return [
        ...currentCart,
        {
          menu_item_id: item.id,
          name: item.name,
          price,
          quantity: 1,
          image_url: item.image_url,
        },
      ];
    });
  }

  function increaseQuantity(id: number) {
    setCart((currentCart) =>
      currentCart.map((item) =>
        item.menu_item_id === id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      )
    );
  }

  function decreaseQuantity(id: number) {
    setCart((currentCart) =>
      currentCart
        .map((item) =>
          item.menu_item_id === id
            ? { ...item, quantity: item.quantity - 1 }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  }

  function removeFromCart(id: number) {
    setCart((currentCart) =>
      currentCart.filter((item) => item.menu_item_id !== id)
    );
  }

  async function handleCheckout(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (cart.length === 0) {
      setOrderError("Your cart is empty. Please add some dishes first.");
      return;
    }

    setPlacingOrder(true);
    setOrderError("");
    setOrderSuccess("");

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_name: customerName.trim(),
          phone: phone.trim(),
          address: address.trim(),
          items: cart.map((item) => ({
            menu_item_id: item.menu_item_id,
            quantity: item.quantity,
          })),
        }),
      });

      const data = (await response.json()) as OrderResponse;

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to place your order.");
      }

      const orderNumber = data.orderId ? `#${data.orderId}` : "";

      setOrderSuccess(
        `Your order ${orderNumber} has been placed successfully. Total: Rs. ${Number(
          data.totalAmount ?? cartTotal
        ).toFixed(2)}.`
      );

      setCart([]);
      setCustomerName("");
      setPhone("");
      setAddress("");
    } catch (err) {
      console.error("Checkout error:", err);
      setOrderError(
        err instanceof Error
          ? err.message
          : "Something went wrong while placing your order."
      );
    } finally {
      setPlacingOrder(false);
    }
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#11110f] text-[#f5f0e6]">
      {/* Navigation */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#11110f]/95 backdrop-blur-md">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 md:px-12">
          <a
            href="#home"
            className="text-2xl font-bold tracking-[0.2em] md:text-3xl"
          >
            SAVORA<span className="text-[#c9a66b]">.</span>
          </a>

          <div className="hidden items-center gap-7 text-sm text-gray-300 md:flex">
            <a href="#home" className="transition hover:text-[#c9a66b]">
              Home
            </a>
            <a href="#about" className="transition hover:text-[#c9a66b]">
              Our Story
            </a>
            <a href="#highlights" className="transition hover:text-[#c9a66b]">
              Experience
            </a>
            <a href="#menu" className="transition hover:text-[#c9a66b]">
              Menu
            </a>
            <a href="#gallery" className="transition hover:text-[#c9a66b]">
              Gallery
            </a>
            <a
              href="/login"
              className="border-b border-[#c9a66b]/60 pb-1 text-[#c9a66b] transition hover:text-white"
            >
              Admin
            </a>
          </div>

          <div className="hidden items-center gap-4 sm:flex">
            <a
              href="#cart"
              className="relative border border-[#c9a66b]/60 px-5 py-3 text-xs tracking-widest text-[#c9a66b] transition hover:bg-[#c9a66b] hover:text-black"
            >
              CART ({cartCount})
            </a>
            <a
              href="#menu"
              className="border border-[#c9a66b] px-5 py-3 text-xs tracking-widest text-[#c9a66b] transition hover:bg-[#c9a66b] hover:text-black"
            >
              EXPLORE MENU
            </a>
          </div>

          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="text-2xl text-[#c9a66b] md:hidden"
            aria-label="Toggle navigation"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? "✕" : "☰"}
          </button>
        </nav>

        {mobileMenuOpen && (
          <div className="flex flex-col gap-5 border-t border-white/10 bg-[#11110f] px-6 py-6 text-sm text-gray-300 md:hidden">
            {[
              ["Home", "#home"],
              ["Our Story", "#about"],
              ["Experience", "#highlights"],
              ["Menu", "#menu"],
              ["Cart", "#cart"],
              ["Gallery", "#gallery"],
              ["Admin", "/login"],
            ].map(([label, href]) => (
              <a
                key={label}
                href={href}
                onClick={() => setMobileMenuOpen(false)}
                className={`transition hover:text-[#c9a66b] ${
                  label === "Admin" || label === "Cart"
                    ? "font-semibold text-[#c9a66b]"
                    : ""
                }`}
              >
                {label === "Cart" ? `Cart (${cartCount})` : label}
              </a>
            ))}
          </div>
        )}
      </header>

      {/* Hero */}
      <section
        id="home"
        className="relative flex min-h-[680px] items-center bg-cover bg-center md:min-h-[760px]"
        style={{
          backgroundImage: `linear-gradient(90deg, rgba(12,12,10,0.94) 0%, rgba(12,12,10,0.72) 48%, rgba(12,12,10,0.25) 100%), url('${photos.hero}')`,
        }}
      >
        <div className="mx-auto w-full max-w-7xl px-6 py-24 md:px-12">
          <div className="max-w-3xl">
            <p className="mb-8 text-xs tracking-[0.35em] text-[#c9a66b] md:text-sm">
              A TASTE OF ELEGANCE
            </p>
            <h1 className="font-serif text-5xl leading-[1.08] sm:text-6xl md:text-8xl">
              Fine Dining.
              <br />
              <span className="italic text-[#c9a66b]">
                Beautiful Moments.
              </span>
            </h1>
            <p className="mt-8 max-w-xl text-base leading-8 text-gray-300 md:text-lg">
              Discover delicious flavors, thoughtfully presented dishes and a
              dining experience made for unforgettable moments.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <a
                href="#menu"
                className="bg-[#c9a66b] px-8 py-4 text-sm font-bold tracking-wide text-black transition hover:bg-[#dfbd85]"
              >
                DISCOVER OUR MENU
              </a>
              <a
                href="#about"
                className="border border-white/50 px-8 py-4 text-sm transition hover:bg-white hover:text-black"
              >
                OUR STORY
              </a>
            </div>
          </div>
        </div>
        <div className="absolute bottom-8 right-8 hidden text-xs tracking-[0.3em] text-white/60 md:block">
          SAVORA — A DINING EXPERIENCE
        </div>
      </section>

      {/* About */}
      <section id="about" className="px-6 py-24 md:px-12 md:py-32">
        <div className="mx-auto grid max-w-7xl items-center gap-14 md:grid-cols-2 md:gap-20">
          <div>
            <p className="mb-6 text-xs tracking-[0.3em] text-[#c9a66b]">
              THE ART OF DINING
            </p>
            <h2 className="font-serif text-4xl leading-tight md:text-6xl">
              More Than Food.
              <br />
              <span className="italic text-[#c9a66b]">An Experience.</span>
            </h2>
            <p className="mt-8 leading-8 text-gray-400">
              At Savora, every meal is an opportunity to enjoy beautiful
              flavors and thoughtful presentation. We believe great dining is
              about the little details that make a moment memorable.
            </p>
            <a
              href="#menu"
              className="mt-9 inline-flex items-center gap-4 border-b border-[#c9a66b]/50 pb-3 text-sm tracking-widest text-[#c9a66b] transition hover:border-[#c9a66b]"
            >
              EXPLORE OUR MENU <span>→</span>
            </a>
          </div>
          <div className="relative">
            <div className="absolute -left-4 -top-4 h-full w-full border border-[#c9a66b]/60" />
            <img
              src={photos.story}
              alt="Restaurant dining experience"
              className="relative h-[420px] w-full object-cover"
            />
            <div className="absolute bottom-0 left-0 bg-[#c9a66b] px-7 py-5 text-black">
              <p className="text-xs tracking-widest">SAVORA</p>
              <p className="font-serif text-2xl italic">
                Made to be enjoyed.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Signature experience cards */}
      <section
        id="highlights"
        className="bg-[#191916] px-6 py-24 md:px-12"
      >
        <div className="mx-auto max-w-7xl">
          <div className="mb-16 text-center">
            <p className="mb-5 text-xs tracking-[0.3em] text-[#c9a66b]">
              THE SAVORA EXPERIENCE
            </p>
            <h2 className="font-serif text-4xl md:text-5xl">
              The Details Matter
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-gray-400">
              Every detail comes together to create a memorable dining
              experience.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {highlights.map((item) => (
              <article
                key={item.number}
                className="group overflow-hidden border border-white/10 transition duration-300 hover:border-[#c9a66b]/60"
              >
                <div className="overflow-hidden">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="h-64 w-full object-cover transition duration-700 group-hover:scale-105"
                  />
                </div>
                <div className="p-8">
                  <span className="text-sm tracking-widest text-[#c9a66b]">
                    {item.number}
                  </span>
                  <h3 className="mb-5 mt-5 font-serif text-2xl">
                    {item.title}
                  </h3>
                  <p className="text-sm leading-7 text-gray-400">
                    {item.description}
                  </p>
                  <div className="mt-8 h-px w-12 bg-[#c9a66b] transition-all duration-300 group-hover:w-20" />
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Signature Dishes introduction */}
      <section className="px-6 py-24 md:px-12">
        <div className="mx-auto grid max-w-7xl items-center gap-12 md:grid-cols-2">
          <div className="relative overflow-hidden">
            <img
              src={photos.gallery2}
              alt="Freshly prepared restaurant food"
              className="h-[420px] w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <p className="absolute bottom-7 left-7 text-xs tracking-[0.3em] text-[#e2c18a]">
              FRESH • FLAVOR • QUALITY
            </p>
          </div>
          <div>
            <p className="mb-6 text-xs tracking-[0.3em] text-[#c9a66b]">
              A SELECTION TO ENJOY
            </p>
            <h2 className="font-serif text-4xl leading-tight md:text-6xl">
              Crafted with Care.
              <br />
              <span className="italic text-[#c9a66b]">
                Served with Love.
              </span>
            </h2>
            <p className="mt-8 leading-8 text-gray-400">
              Explore a selection of dishes prepared for a satisfying dining
              experience. Discover the menu and find something delicious to
              enjoy.
            </p>
            <a
              href="#menu"
              className="mt-9 inline-block bg-[#c9a66b] px-8 py-4 text-sm font-bold tracking-widest text-black transition hover:bg-[#dfbd85]"
            >
              VIEW ALL DISHES
            </a>
          </div>
        </div>
      </section>

      {/* Public Menu */}
      <section
        id="menu"
        className="bg-[#191916] px-6 py-24 md:px-12 md:py-32"
      >
        <div className="mx-auto max-w-7xl">
          <div className="mb-14 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="mb-5 text-xs tracking-[0.3em] text-[#c9a66b]">
                DISCOVER OUR SELECTION
              </p>
              <h2 className="font-serif text-4xl md:text-6xl">
                The Menu
              </h2>
              <p className="mt-5 text-gray-400">
                Explore the dishes available at Savora.
              </p>
            </div>
            <span className="text-sm text-gray-400">
              {filteredMenuItems.length}{" "}
              {filteredMenuItems.length === 1 ? "DISH" : "DISHES"} SHOWING
            </span>
          </div>

          {error && (
            <p className="mb-8 text-center text-red-400">{error}</p>
          )}

          {loading ? (
            <p className="py-16 text-center text-gray-400">
              Preparing our menu...
            </p>
          ) : menuItems.length === 0 ? (
            <div className="border border-white/10 py-20 text-center">
              <p className="font-serif text-2xl">Our menu awaits.</p>
              <p className="mt-3 text-sm text-gray-400">
                New dishes will appear here soon.
              </p>
            </div>
          ) : (
            <>
              <div className="mb-12 flex flex-wrap gap-3">
                {categories.map((category) => {
                  const isActive = selectedCategory === category;

                  return (
                    <button
                      key={category}
                      type="button"
                      onClick={() => setSelectedCategory(category)}
                      className={`border px-6 py-3 text-xs font-semibold tracking-widest transition duration-300 ${
                        isActive
                          ? "border-[#c9a66b] bg-[#c9a66b] text-black"
                          : "border-white/15 text-gray-300 hover:border-[#c9a66b] hover:text-[#c9a66b]"
                      }`}
                    >
                      {category === "All"
                        ? "ALL DISHES"
                        : category.toUpperCase()}
                    </button>
                  );
                })}
              </div>

              {filteredMenuItems.length === 0 ? (
                <div className="border border-white/10 py-20 text-center">
                  <p className="font-serif text-2xl">
                    No dishes in this category.
                  </p>
                  <p className="mt-3 text-sm text-gray-400">
                    Select another category to explore our menu.
                  </p>
                  <button
                    type="button"
                    onClick={() => setSelectedCategory("All")}
                    className="mt-7 border border-[#c9a66b] px-6 py-3 text-xs tracking-widest text-[#c9a66b] transition hover:bg-[#c9a66b] hover:text-black"
                  >
                    VIEW ALL DISHES
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-7 md:grid-cols-2 lg:grid-cols-3">
                  {filteredMenuItems.map((item) => (
                    <article
                      key={item.id}
                      className="group overflow-hidden border border-white/10 bg-[#11110f] transition duration-300 hover:border-[#c9a66b]/70"
                    >
                      <div className="relative h-64 overflow-hidden bg-[#22221e]">
                        <img
                          src={getDishImage(item)}
                          alt={item.name}
                          loading="lazy"
                          onError={(event) => {
                            event.currentTarget.src = photos.gallery3;
                          }}
                          className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                        />

                        <span className="absolute bottom-4 left-4 bg-black/75 px-4 py-2 text-xs tracking-widest text-[#c9a66b]">
                          {item.category?.trim() || "Uncategorized"}
                        </span>
                      </div>

                      <div className="p-7">
                        <div className="flex items-start justify-between gap-4">
                          <h3 className="font-serif text-2xl transition group-hover:text-[#c9a66b]">
                            {item.name}
                          </h3>
                          <span className="whitespace-nowrap font-semibold text-[#c9a66b]">
                            Rs. {Number(item.price).toFixed(2)}
                          </span>
                        </div>

                        <div className="my-6 h-px w-12 bg-[#c9a66b] transition-all duration-300 group-hover:w-20" />

                        <p className="min-h-14 text-sm leading-7 text-gray-400">
                          {item.description ||
                            "A delicious selection from Savora."}
                        </p>

                        <button
                          type="button"
                          onClick={() => addToCart(item)}
                          className="mt-7 w-full bg-[#c9a66b] px-5 py-4 text-xs font-bold tracking-widest text-black transition hover:bg-[#dfbd85]"
                        >
                          ADD TO CART +
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* Shopping Cart and Checkout */}
      <section
        id="cart"
        className="scroll-mt-24 px-6 py-24 md:px-12 md:py-32"
      >
        <div className="mx-auto max-w-7xl">
          <div className="mb-14 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="mb-5 text-xs tracking-[0.3em] text-[#c9a66b]">
                YOUR SELECTION
              </p>
              <h2 className="font-serif text-4xl md:text-6xl">
                Your Cart
              </h2>
              <p className="mt-5 text-gray-400">
                Review your dishes and complete your order.
              </p>
            </div>
            <span className="text-sm tracking-widest text-[#c9a66b]">
              {cartCount} {cartCount === 1 ? "ITEM" : "ITEMS"}
            </span>
          </div>

          {orderSuccess && (
            <div className="mb-8 border border-green-500/40 bg-green-500/10 p-6 text-green-300">
              <p className="font-semibold">ORDER CONFIRMED</p>
              <p className="mt-2 text-sm leading-7">{orderSuccess}</p>
            </div>
          )}

          {orderError && (
            <div className="mb-8 border border-red-500/40 bg-red-500/10 p-5 text-sm text-red-300">
              {orderError}
            </div>
          )}

          {cart.length === 0 ? (
            <div className="border border-white/10 bg-[#191916] px-6 py-20 text-center">
              <p className="font-serif text-3xl">Your cart is empty.</p>
              <p className="mt-4 text-sm text-gray-400">
                Explore our menu and add your favourite dishes.
              </p>
              <a
                href="#menu"
                className="mt-8 inline-block bg-[#c9a66b] px-8 py-4 text-xs font-bold tracking-widest text-black transition hover:bg-[#dfbd85]"
              >
                EXPLORE MENU
              </a>
            </div>
          ) : (
            <div className="grid items-start gap-10 lg:grid-cols-[1.15fr_0.85fr]">
              <div className="border border-white/10 bg-[#191916] p-6 md:p-8">
                <h3 className="mb-7 font-serif text-2xl">
                  Selected Dishes
                </h3>

                <div className="space-y-6">
                  {cart.map((item) => (
                    <div
                      key={item.menu_item_id}
                      className="flex flex-col gap-5 border-b border-white/10 pb-6 sm:flex-row sm:items-center"
                    >
                      <img
                        src={getDishImage(item)}
                        alt={item.name}
                        onError={(event) => {
                          event.currentTarget.src = photos.gallery3;
                        }}
                        className="h-24 w-full object-cover sm:w-28"
                      />

                      <div className="min-w-0 flex-1">
                        <h4 className="font-serif text-xl">{item.name}</h4>
                        <p className="mt-2 text-sm text-[#c9a66b]">
                          Rs. {item.price.toFixed(2)} each
                        </p>

                        <div className="mt-4 flex flex-wrap items-center gap-3">
                          <button
                            type="button"
                            onClick={() =>
                              decreaseQuantity(item.menu_item_id)
                            }
                            aria-label={`Decrease ${item.name} quantity`}
                            className="h-9 w-9 border border-white/20 text-lg transition hover:border-[#c9a66b] hover:text-[#c9a66b]"
                          >
                            −
                          </button>

                          <span className="min-w-6 text-center text-sm">
                            {item.quantity}
                          </span>

                          <button
                            type="button"
                            onClick={() =>
                              increaseQuantity(item.menu_item_id)
                            }
                            aria-label={`Increase ${item.name} quantity`}
                            className="h-9 w-9 border border-white/20 text-lg transition hover:border-[#c9a66b] hover:text-[#c9a66b]"
                          >
                            +
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              removeFromCart(item.menu_item_id)
                            }
                            className="ml-2 text-xs tracking-widest text-red-400 transition hover:text-red-300"
                          >
                            REMOVE
                          </button>
                        </div>
                      </div>

                      <div className="font-semibold text-[#c9a66b] sm:text-right">
                        Rs. {(item.price * item.quantity).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-8 flex items-center justify-between gap-4">
                  <span className="text-sm text-gray-400">Order Total</span>
                  <span className="text-2xl font-semibold text-[#c9a66b]">
                    Rs. {cartTotal.toFixed(2)}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setCart([]);
                    setOrderError("");
                    setOrderSuccess("");
                  }}
                  className="mt-7 text-xs tracking-widest text-gray-400 transition hover:text-red-400"
                >
                  CLEAR CART
                </button>
              </div>

              <div className="border border-white/10 bg-[#191916] p-6 md:p-8">
                <p className="mb-3 text-xs tracking-[0.3em] text-[#c9a66b]">
                  ALMOST THERE
                </p>
                <h3 className="mb-8 font-serif text-3xl">Checkout</h3>

                <form onSubmit={handleCheckout} className="space-y-6">
                  <div>
                    <label
                      htmlFor="customerName"
                      className="mb-2 block text-xs tracking-widest text-gray-300"
                    >
                      CUSTOMER NAME
                    </label>
                    <input
                      id="customerName"
                      type="text"
                      required
                      maxLength={120}
                      autoComplete="name"
                      value={customerName}
                      onChange={(event) =>
                        setCustomerName(event.target.value)
                      }
                      placeholder="Enter your full name"
                      className="w-full border border-white/15 bg-[#11110f] px-4 py-4 text-sm text-white outline-none transition placeholder:text-gray-600 focus:border-[#c9a66b]"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="customerPhone"
                      className="mb-2 block text-xs tracking-widest text-gray-300"
                    >
                      PHONE NUMBER
                    </label>
                    <input
                      id="customerPhone"
                      type="tel"
                      required
                      maxLength={30}
                      autoComplete="tel"
                      value={phone}
                      onChange={(event) => setPhone(event.target.value)}
                      placeholder="Enter your phone number"
                      className="w-full border border-white/15 bg-[#11110f] px-4 py-4 text-sm text-white outline-none transition placeholder:text-gray-600 focus:border-[#c9a66b]"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="customerAddress"
                      className="mb-2 block text-xs tracking-widest text-gray-300"
                    >
                      DELIVERY ADDRESS
                    </label>
                    <textarea
                      id="customerAddress"
                      required
                      maxLength={1000}
                      rows={4}
                      autoComplete="street-address"
                      value={address}
                      onChange={(event) => setAddress(event.target.value)}
                      placeholder="Enter your complete delivery address"
                      className="w-full resize-y border border-white/15 bg-[#11110f] px-4 py-4 text-sm text-white outline-none transition placeholder:text-gray-600 focus:border-[#c9a66b]"
                    />
                  </div>

                  <div className="border-t border-white/10 pt-6">
                    <div className="mb-6 flex items-center justify-between gap-4">
                      <span className="text-sm text-gray-400">
                        Total to Pay
                      </span>
                      <span className="text-xl font-semibold text-[#c9a66b]">
                        Rs. {cartTotal.toFixed(2)}
                      </span>
                    </div>

                    <button
                      type="submit"
                      disabled={placingOrder || cart.length === 0}
                      className="w-full bg-[#c9a66b] px-6 py-5 text-xs font-bold tracking-[0.2em] text-black transition hover:bg-[#dfbd85] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {placingOrder
                        ? "PLACING YOUR ORDER..."
                        : "CONFIRM ORDER"}
                    </button>

                    <p className="mt-4 text-center text-xs leading-6 text-gray-500">
                      Please check your details before confirming your order.
                    </p>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Food Gallery */}
      <section
        id="gallery"
        className="px-6 py-24 md:px-12 md:py-32"
      >
        <div className="mx-auto max-w-7xl">
          <div className="mb-14 text-center">
            <p className="mb-5 text-xs tracking-[0.3em] text-[#c9a66b]">
              A VISUAL TASTE
            </p>
            <h2 className="font-serif text-4xl md:text-6xl">
              Moments at Savora
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-gray-400">
              A glimpse of the flavors, presentation and atmosphere that make
              dining special.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {gallery.map((item) => (
              <div
                key={item.title}
                className="group relative overflow-hidden"
              >
                <img
                  src={item.image}
                  alt={item.title}
                  className="h-80 w-full object-cover transition duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                <p className="absolute bottom-6 left-6 font-serif text-xl">
                  {item.title}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Closing section */}
      <section
        className="relative bg-cover bg-center px-6 py-28 text-center md:px-12"
        style={{
          backgroundImage: `linear-gradient(rgba(10,10,9,0.82), rgba(10,10,9,0.88)), url('${photos.dining}')`,
        }}
      >
        <div className="mx-auto max-w-3xl">
          <p className="mb-6 text-xs tracking-[0.35em] text-[#c9a66b]">
            YOUR TABLE OF FLAVORS
          </p>
          <h2 className="font-serif text-4xl md:text-6xl">
            Make Every Meal
            <span className="mt-2 block italic text-[#c9a66b]">
              A Beautiful Moment.
            </span>
          </h2>
          <p className="mx-auto mt-7 max-w-xl leading-8 text-gray-300">
            Discover the Savora menu and explore the dishes waiting for you.
          </p>
          <a
            href="#menu"
            className="mt-9 inline-block bg-[#c9a66b] px-9 py-4 text-sm font-bold tracking-widest text-black transition hover:bg-[#dfbd85]"
          >
            EXPLORE THE MENU
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 px-6 pb-8 pt-16 md:px-12">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-10 pb-14 md:grid-cols-3">
            <div>
              <a
                href="#home"
                className="text-3xl font-bold tracking-[0.2em]"
              >
                SAVORA<span className="text-[#c9a66b]">.</span>
              </a>
              <p className="mt-5 max-w-xs text-sm leading-7 text-gray-500">
                Fine dining, thoughtful flavors and beautiful moments.
              </p>
            </div>

            <div>
              <h3 className="mb-6 text-xs tracking-widest text-[#c9a66b]">
                EXPLORE
              </h3>
              <div className="flex flex-col gap-4 text-sm text-gray-400">
                <a href="#home" className="hover:text-[#c9a66b]">
                  Home
                </a>
                <a href="#about" className="hover:text-[#c9a66b]">
                  Our Story
                </a>
                <a href="#highlights" className="hover:text-[#c9a66b]">
                  Experience
                </a>
                <a href="#menu" className="hover:text-[#c9a66b]">
                  Our Menu
                </a>
                <a href="#cart" className="hover:text-[#c9a66b]">
                  Your Cart
                </a>
                <a href="#gallery" className="hover:text-[#c9a66b]">
                  Gallery
                </a>
                <a
                  href="/login"
                  className="font-semibold text-[#c9a66b] hover:text-white"
                >
                  Admin Login →
                </a>
              </div>
            </div>

            <div>
              <h3 className="mb-6 text-xs tracking-widest text-[#c9a66b]">
                OUR PHILOSOPHY
              </h3>
              <p className="text-sm leading-7 text-gray-400">
                Good food brings people together. Every detail matters, from
                the first impression to the last bite.
              </p>
            </div>
          </div>

          <div className="flex flex-col justify-between gap-4 border-t border-white/10 pt-7 text-xs text-gray-500 md:flex-row">
            <p>© 2026 SAVORA Restaurant. All rights reserved.</p>
            <a href="#home" className="hover:text-[#c9a66b]">
              BACK TO TOP ↑
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}
