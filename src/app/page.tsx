
"use client";

import { useEffect, useState } from "react";

interface MenuItem {
  id: number;
  name: string;
  price: string | number;
  description: string;
}

interface ApiResponse {
  success: boolean;
  message?: string;
  menuItems?: MenuItem[];
  menuItem?: MenuItem;
}

async function readApiResponse(response: Response): Promise<ApiResponse> {
  const text = await response.text();

  if (!text.trim()) {
    throw new Error(
      `Server returned an empty response. Status: ${response.status}`
    );
  }

  try {
    return JSON.parse(text) as ApiResponse;
  } catch {
    console.error("Invalid API response:", text);
    throw new Error(
      "Server returned an invalid response. Please check the API."
    );
  }
}

export default function Home() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  async function fetchMenu() {
    try {
      setLoading(true);

      const response = await fetch("/api/menu", {
        cache: "no-store",
      });

      const data = await readApiResponse(response);

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to load menu");
      }

      setMenuItems(data.menuItems || []);
      setError("");
    } catch (err) {
      console.error("Fetch menu error:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load menu items. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchMenu();
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    try {
      setSubmitting(true);
      setError("");
      setMessage("");

      const response = await fetch("/api/menu", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          price: Number(price),
          description: description.trim(),
        }),
      });

      const data = await readApiResponse(response);

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to add item");
      }

      setName("");
      setPrice("");
      setDescription("");

      setMessage("Your new dish has been added successfully.");

      await fetchMenu();
    } catch (err) {
      console.error("Add menu item error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while adding the item."
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: number) {
    if (!window.confirm("Are you sure you want to delete this item?")) {
      return;
    }

    try {
      setDeletingId(id);
      setError("");
      setMessage("");

      const response = await fetch("/api/menu", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id }),
      });

      const data = await readApiResponse(response);

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to delete item");
      }

      setMenuItems((items) => items.filter((item) => item.id !== id));
      setMessage("Menu item deleted successfully.");
    } catch (err) {
      console.error("Delete menu item error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to delete item."
      );
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <main className="min-h-screen bg-[#11110f] text-[#f5f0e6]">
      {/* Navigation */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#11110f]/95 backdrop-blur-md">
        <nav className="max-w-7xl mx-auto px-6 md:px-12 py-5 flex items-center justify-between">
          <a href="#home" className="text-2xl font-bold tracking-[0.2em]">
            SAVORA<span className="text-[#c9a66b]">.</span>
          </a>

          <div className="hidden md:flex items-center gap-9 text-sm text-gray-300">
            <a href="#home" className="hover:text-[#c9a66b] transition">
              Home
            </a>
            <a href="#about" className="hover:text-[#c9a66b] transition">
              Our Story
            </a>
            <a href="#highlights" className="hover:text-[#c9a66b] transition">
              Experience
            </a>
            <a href="#menu" className="hover:text-[#c9a66b] transition">
              Menu
            </a>
            <a href="#manage" className="hover:text-[#c9a66b] transition">
              Manage Menu
            </a>
          </div>

          <a
            href="#menu"
            className="border border-[#c9a66b] text-[#c9a66b] px-5 py-3 text-xs tracking-widest hover:bg-[#c9a66b] hover:text-black transition"
          >
            EXPLORE MENU
          </a>
        </nav>
      </header>

      {/* Hero */}
      <section
        id="home"
        className="relative min-h-[680px] md:min-h-[760px] flex items-center bg-cover bg-center"
        style={{
          backgroundImage:
            "linear-gradient(90deg, rgba(12,12,10,0.94) 0%, rgba(12,12,10,0.72) 48%, rgba(12,12,10,0.22) 100%), url('/hero.jpg')",
        }}
      >
        <div className="max-w-7xl mx-auto w-full px-6 md:px-12 py-24">
          <div className="max-w-3xl">
            <p className="text-[#c9a66b] tracking-[0.35em] text-xs md:text-sm mb-8">
              A TASTE OF ELEGANCE
            </p>

            <h1 className="text-5xl sm:text-6xl md:text-8xl font-serif leading-[1.08]">
              Fine Dining.
              <br />
              <span className="italic text-[#c9a66b]">
                Beautiful Moments.
              </span>
            </h1>

            <p className="text-gray-300 text-base md:text-lg mt-8 max-w-xl leading-8">
              Discover delicious flavors, thoughtfully presented dishes
              and a dining experience made for unforgettable moments.
            </p>

            <div className="flex flex-wrap gap-4 mt-10">
              <a
                href="#menu"
                className="bg-[#c9a66b] text-black px-8 py-4 text-sm font-bold tracking-wide hover:bg-[#dfbd85] transition"
              >
                DISCOVER OUR MENU
              </a>

              <a
                href="#about"
                className="border border-white/50 px-8 py-4 text-sm hover:bg-white hover:text-black transition"
              >
                OUR STORY
              </a>
            </div>
          </div>
        </div>

        <div className="absolute bottom-8 right-8 hidden md:block text-xs tracking-[0.3em] text-white/60">
          SAVORA — A DINING EXPERIENCE
        </div>
      </section>

      {/* Intro */}
      <section id="about" className="py-24 md:py-32 px-6 md:px-12">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-14 md:gap-20 items-center">
          <div>
            <p className="text-[#c9a66b] tracking-[0.3em] text-xs mb-6">
              THE ART OF DINING
            </p>

            <h2 className="text-4xl md:text-6xl font-serif leading-tight">
              More Than Food.
              <br />
              <span className="italic text-[#c9a66b]">An Experience.</span>
            </h2>

            <p className="text-gray-400 leading-8 mt-8">
              At Savora, every meal is an opportunity to enjoy beautiful
              flavors and thoughtful presentation. We believe great dining
              is about the little details that make a moment memorable.
            </p>

            <a
              href="#menu"
              className="inline-flex items-center gap-4 text-[#c9a66b] mt-9 text-sm tracking-widest border-b border-[#c9a66b]/50 pb-3 hover:border-[#c9a66b] transition"
            >
              EXPLORE OUR MENU <span>→</span>
            </a>
          </div>

          <div className="relative">
            <div className="absolute -top-4 -left-4 border border-[#c9a66b]/60 w-full h-full" />
            <img
              src="/hero.jpg"
              alt="Savora restaurant featured dish"
              className="relative w-full h-[420px] object-cover"
            />
            <div className="absolute bottom-0 left-0 bg-[#c9a66b] text-black px-7 py-5">
              <p className="text-xs tracking-widest">SAVORA</p>
              <p className="font-serif text-2xl italic">
                Made to be enjoyed.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Highlights */}
      <section id="highlights" className="bg-[#191916] py-24 px-6 md:px-12">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-[#c9a66b] tracking-[0.3em] text-xs mb-5">
              THE SAVORA EXPERIENCE
            </p>
            <h2 className="text-4xl md:text-5xl font-serif">
              The Details Matter
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                number: "01",
                title: "Thoughtful Flavors",
                description:
                  "A menu experience focused on enjoyable flavors and careful presentation.",
              },
              {
                number: "02",
                title: "Elegant Dining",
                description:
                  "A refined atmosphere designed around the pleasure of dining.",
              },
              {
                number: "03",
                title: "Memorable Moments",
                description:
                  "A place to enjoy good food and make every meal feel special.",
              },
            ].map((item) => (
              <div
                key={item.number}
                className="border border-white/10 p-9 hover:border-[#c9a66b]/60 transition duration-300"
              >
                <span className="text-[#c9a66b] text-sm tracking-widest">
                  {item.number}
                </span>

                <h3 className="text-2xl font-serif mt-7 mb-5">
                  {item.title}
                </h3>

                <p className="text-gray-400 text-sm leading-7">
                  {item.description}
                </p>

                <div className="w-12 h-px bg-[#c9a66b] mt-8" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Menu */}
      <section id="menu" className="py-24 md:py-32 px-6 md:px-12">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-14">
            <div>
              <p className="text-[#c9a66b] tracking-[0.3em] text-xs mb-5">
                DISCOVER OUR SELECTION
              </p>

              <h2 className="text-4xl md:text-6xl font-serif">
                The Menu
              </h2>

              <p className="text-gray-400 mt-5">
                Explore the dishes available at Savora.
              </p>
            </div>

            <span className="text-gray-400 text-sm">
              {menuItems.length}{" "}
              {menuItems.length === 1 ? "DISH" : "DISHES"} AVAILABLE
            </span>
          </div>

          {error && (
            <p className="text-center text-red-400 mb-8">{error}</p>
          )}

          {message && (
            <p className="text-center text-[#c9a66b] mb-8">{message}</p>
          )}

          {loading ? (
            <p className="text-center text-gray-400 py-16">
              Preparing our menu...
            </p>
          ) : menuItems.length === 0 ? (
            <div className="text-center border border-white/10 py-20">
              <p className="text-2xl font-serif">Our menu awaits.</p>
              <p className="text-gray-400 mt-3 text-sm">
                New dishes will appear here when added.
              </p>
              <a
                href="#manage"
                className="inline-block mt-7 text-[#c9a66b] border-b border-[#c9a66b] pb-2 text-sm"
              >
                ADD YOUR FIRST DISH →
              </a>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {menuItems.map((item) => (
                <article
                  key={item.id}
                  className="group bg-[#191916] border border-white/10 p-8 hover:border-[#c9a66b]/70 transition duration-300"
                >
                  <div className="flex justify-between items-start gap-4">
                    <h3 className="text-2xl font-serif group-hover:text-[#c9a66b] transition">
                      {item.name}
                    </h3>

                    <span className="text-[#c9a66b] font-semibold whitespace-nowrap">
                      Rs. {Number(item.price).toFixed(2)}
                    </span>
                  </div>

                  <div className="w-12 h-px bg-[#c9a66b] my-6 group-hover:w-20 transition-all duration-300" />

                  <p className="text-gray-400 text-sm leading-7 min-h-14">
                    {item.description || "A delicious selection from Savora."}
                  </p>

                  <button
                    onClick={() => handleDelete(item.id)}
                    disabled={deletingId === item.id}
                    className="mt-8 text-xs tracking-widest text-red-400 border border-red-400/30 px-5 py-3 hover:bg-red-500 hover:text-white transition disabled:opacity-50"
                  >
                    {deletingId === item.id ? "DELETING..." : "DELETE ITEM"}
                  </button>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Manage Menu */}
      <section
        id="manage"
        className="bg-[#191916] py-24 md:py-32 px-6 md:px-12"
      >
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-16 items-center">
          <div>
            <p className="text-[#c9a66b] tracking-[0.3em] text-xs mb-6">
              RESTAURANT MANAGEMENT
            </p>

            <h2 className="text-4xl md:text-6xl font-serif leading-tight">
              Create Your
              <br />
              <span className="italic text-[#c9a66b]">
                Next Favorite.
              </span>
            </h2>

            <p className="text-gray-400 leading-8 mt-8 max-w-lg">
              Add new dishes to the Savora menu. Your changes are saved
              directly to the restaurant database and remain available
              after refreshing the website.
            </p>

            <div className="mt-10 border-l-2 border-[#c9a66b] pl-5">
              <p className="font-serif text-xl">
                Simple. Elegant. Dynamic.
              </p>
              <p className="text-gray-500 text-sm mt-2">
                Powered by Next.js and NeonDB.
              </p>
            </div>
          </div>

          <div className="bg-[#11110f] border border-white/10 p-7 md:p-10">
            <h3 className="text-2xl font-serif mb-8">
              Add A New Dish
            </h3>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-xs tracking-widest text-gray-400 mb-3">
                  FOOD NAME
                </label>

                <input
                  type="text"
                  placeholder="Enter dish name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full bg-[#191916] border border-white/15 p-4 text-white outline-none focus:border-[#c9a66b] transition"
                />
              </div>

              <div>
                <label className="block text-xs tracking-widest text-gray-400 mb-3">
                  PRICE (PKR)
                </label>

                <input
                  type="number"
                  placeholder="Enter price"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  min="0.01"
                  step="0.01"
                  required
                  className="w-full bg-[#191916] border border-white/15 p-4 text-white outline-none focus:border-[#c9a66b] transition"
                />
              </div>

              <div>
                <label className="block text-xs tracking-widest text-gray-400 mb-3">
                  DESCRIPTION
                </label>

                <textarea
                  placeholder="Describe your dish"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className="w-full bg-[#191916] border border-white/15 p-4 text-white outline-none focus:border-[#c9a66b] transition resize-none"
                />
              </div>

              {error && (
                <p className="text-red-400 text-sm">{error}</p>
              )}

              {message && (
                <p className="text-[#c9a66b] text-sm">{message}</p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-[#c9a66b] text-black py-4 font-bold tracking-widest hover:bg-[#dfbd85] transition disabled:opacity-50"
              >
                {submitting ? "ADDING DISH..." : "ADD TO MENU"}
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 px-6 md:px-12 pt-16 pb-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-10 pb-14">
            <div>
              <a
                href="#home"
                className="text-3xl font-bold tracking-[0.2em]"
              >
                SAVORA<span className="text-[#c9a66b]">.</span>
              </a>
              <p className="text-gray-500 text-sm leading-7 mt-5 max-w-xs">
                Fine dining, thoughtful flavors and beautiful moments.
              </p>
            </div>

            <div>
              <h3 className="text-[#c9a66b] text-xs tracking-widest mb-6">
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
              </div>
            </div>

            <div>
              <h3 className="text-[#c9a66b] text-xs tracking-widest mb-6">
                OUR PHILOSOPHY
              </h3>
              <p className="text-gray-400 text-sm leading-7">
                Good food brings people together. Every detail matters,
                from the first impression to the last bite.
              </p>
            </div>
          </div>

          <div className="border-t border-white/10 pt-7 flex flex-col md:flex-row justify-between gap-4 text-xs text-gray-500">
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
