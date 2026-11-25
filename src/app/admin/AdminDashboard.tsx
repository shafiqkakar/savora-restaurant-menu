"use client";

import { useEffect, useMemo, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { useRouter } from "next/navigation";

type MenuItem = {
  id: number;
  name: string;
  price: number | string;
  description: string;
  image_url: string | null;
  category: string;
};

type OrderItem = {
  id: number;
  order_id: number;
  menu_item_id: number | null;
  item_name: string;
  quantity: number;
  price: number | string;
};

type OrderStatus = "Pending" | "Preparing" | "Ready" | "Completed";

type Order = {
  id: number;
  customer_name: string;
  phone: string;
  address: string;
  total_amount: number | string;
  status: OrderStatus;
  created_at: string;
  items: OrderItem[];
};

type Activity = {
  id: number;
  title: string;
  detail: string;
  time: string;
};

type DishImageResult = {
  idMeal: string;
  strMeal: string;
  strMealThumb: string;
};

type Tab =
  | "overview"
  | "menu"
  | "orders"
  | "analytics"
  | "security"
  | "settings";

type AnalyticsPeriod = "daily" | "weekly" | "monthly";
type SortOption = "newest" | "oldest" | "price-low" | "price-high" | "name";

const DEFAULT_CATEGORIES = [
  "Burgers",
  "Pizza",
  "Pasta",
  "Sandwiches",
  "Fast Food",
  "BBQ",
  "Drinks",
  "Desserts",
  "Salads",
  "Breakfast",
  "Uncategorized",
];

const ORDER_STATUSES: OrderStatus[] = [
  "Pending",
  "Preparing",
  "Ready",
  "Completed",
];

const inputClass =
  "w-full min-w-0 bg-[#11120f] border border-white/10 rounded-xl p-3 text-base sm:text-sm outline-none focus:border-[#c6aa79] focus:ring-2 focus:ring-[#c6aa79]/20";

const cardClass =
  "min-w-0 bg-[#1c1d18] border border-[#c6aa79]/15 rounded-2xl p-4 sm:p-5 md:p-6";

export default function AdminDashboard() {
  const router = useRouter();

  // NAVIGATION
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // MENU FORM
  const [items, setItems] = useState<MenuItem[]>([]);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
  const [category, setCategory] = useState("Uncategorized");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [autoImageLoading, setAutoImageLoading] = useState(false);
  const [manualImage, setManualImage] = useState(false);
  const [imageResults, setImageResults] = useState<DishImageResult[]>([]);
  const [selectedImageName, setSelectedImageName] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortBy, setSortBy] = useState<SortOption>("newest");

  // ORDERS
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersRefreshing, setOrdersRefreshing] = useState(false);
  const [ordersSearch, setOrdersSearch] = useState("");
  const [ordersStatusFilter, setOrdersStatusFilter] = useState("all");
  const [updatingOrderId, setUpdatingOrderId] = useState<number | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [analyticsPeriod, setAnalyticsPeriod] =
    useState<AnalyticsPeriod>("weekly");

  // NOTIFICATIONS AND ACTIVITY
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [activities, setActivities] = useState<Activity[]>([]);

  // SECURITY
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  function currency(value: number) {
    return `PKR ${value.toLocaleString("en-PK", {
      maximumFractionDigits: 2,
    })}`;
  }

  function formatDate(value: string) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Date unavailable";

    return date.toLocaleString("en-PK", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  }

  function addActivity(title: string, detail: string) {
    setActivities((previous) =>
      [
        {
          id: Date.now(),
          title,
          detail,
          time: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        },
        ...previous,
      ].slice(0, 8)
    );
  }

  function statusStyle(status: OrderStatus) {
    switch (status) {
      case "Pending":
        return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";
      case "Preparing":
        return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      case "Ready":
        return "bg-purple-500/10 text-purple-400 border-purple-500/20";
      case "Completed":
        return "bg-green-500/10 text-green-400 border-green-500/20";
    }
  }

  // MENU API
  async function fetchMenu(showRefresh = false) {
    try {
      if (showRefresh) setRefreshing(true);
      else setLoading(true);

      const response = await fetch("/api/menu", { cache: "no-store" });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Could not load menu.");
      }

      setItems(data.menuItems || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load menu.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  // ORDERS API
  async function fetchOrders(showRefresh = false) {
    try {
      if (showRefresh) setOrdersRefreshing(true);
      else setOrdersLoading(true);

      const response = await fetch("/api/orders", { cache: "no-store" });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Could not load orders.");
      }

      setOrders(
        (data.orders || []).map((order: Order) => ({
          ...order,
          items: Array.isArray(order.items) ? order.items : [],
        }))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load orders.");
    } finally {
      setOrdersLoading(false);
      setOrdersRefreshing(false);
    }
  }

  async function handleOrderStatusChange(
    orderId: number,
    status: OrderStatus
  ) {
    setUpdatingOrderId(orderId);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, status }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Status update failed.");
      }

      setOrders((previous) =>
        previous.map((order) =>
          order.id === orderId ? { ...order, status } : order
        )
      );

      setSelectedOrder((previous) =>
        previous?.id === orderId ? { ...previous, status } : previous
      );

      setMessage(`Order #${orderId} updated to ${status}.`);
      addActivity("Order status updated", `Order #${orderId} · ${status}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update order.");
    } finally {
      setUpdatingOrderId(null);
    }
  }

  useEffect(() => {
    fetchMenu();
  }, []);

  useEffect(() => {
    if (
      activeTab === "orders" ||
      activeTab === "overview" ||
      activeTab === "analytics"
    ) {
      fetchOrders();
    }
  }, [activeTab]);

  useEffect(() => {
    if (!sidebarOpen) return;

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setSidebarOpen(false);
    }

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [sidebarOpen]);

  // AUTOMATIC DISH IMAGE SEARCH
  useEffect(() => {
    if (editingId !== null || manualImage) {
      setAutoImageLoading(false);
      return;
    }

    const dishName = name.trim();

    if (!dishName) {
      setAutoImageLoading(false);
      setImageUrl("");
      setPreviewUrl("");
      setImageResults([]);
      setSelectedImageName("");
      return;
    }

    let cancelled = false;

    const timer = window.setTimeout(async () => {
      setAutoImageLoading(true);
      setImageUrl("");
      setPreviewUrl("");
      setImageResults([]);
      setSelectedImageName("");
      setMessage("");
      setError("");

      try {
        const response = await fetch(
          `https://www.themealdb.com/api/json/v1/1/search.php?s=${encodeURIComponent(dishName)}`
        );

        if (!response.ok) {
          throw new Error("Automatic image service is unavailable.");
        }

        const data: {
          meals?: Array<{
            idMeal?: string;
            strMeal?: string;
            strMealThumb?: string;
          }> | null;
        } = await response.json();

        const results: DishImageResult[] = (data.meals || [])
          .filter(
            (
              meal
            ): meal is {
              idMeal: string;
              strMeal: string;
              strMealThumb: string;
            } =>
              Boolean(meal.idMeal && meal.strMeal && meal.strMealThumb)
          )
          .map((meal) => ({
            idMeal: meal.idMeal,
            strMeal: meal.strMeal,
            strMealThumb: meal.strMealThumb,
          }));

        const normalize = (value: string) =>
          value.toLowerCase().replace(/[^a-z0-9]/g, "");

        const exactMatch = results.find(
          (meal) => normalize(meal.strMeal) === normalize(dishName)
        );

        if (!cancelled) {
          setImageResults(results);

          if (exactMatch) {
            setImageUrl(exactMatch.strMealThumb);
            setPreviewUrl(exactMatch.strMealThumb);
            setSelectedImageName(exactMatch.strMeal);
            setMessage("Exact dish image found and selected!");
            setError("");
          } else if (results.length > 0) {
            setMessage("Choose the correct image from the suggestions below.");
            setError("");
          } else {
            setMessage("");
            setError(
              "No automatic image found. Please upload the correct image manually."
            );
          }
        }
      } catch {
        if (!cancelled) {
          setImageUrl("");
          setPreviewUrl("");
          setImageResults([]);
          setSelectedImageName("");
          setMessage("");
          setError(
            "Automatic image search is unavailable. Please upload an image manually."
          );
        }
      } finally {
        if (!cancelled) setAutoImageLoading(false);
      }
    }, 800);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [name, editingId, manualImage]);

  // CATEGORIES
  const categories = useMemo(() => {
    const existing = items
      .map((item) => item.category?.trim())
      .filter((value): value is string => Boolean(value));

    return Array.from(new Set([...DEFAULT_CATEGORIES, ...existing])).sort(
      (a, b) => {
        if (a === "Uncategorized") return 1;
        if (b === "Uncategorized") return -1;
        return a.localeCompare(b);
      }
    );
  }, [items]);

  // MENU STATISTICS
  const stats = useMemo(() => {
    const total = items.length;
    const totalValue = items.reduce(
      (sum, item) => sum + (Number(item.price) || 0),
      0
    );
    const imageCount = items.filter((item) => Boolean(item.image_url)).length;

    const highestPrice = items.reduce(
      (highest, item) => Math.max(highest, Number(item.price) || 0),
      0
    );

    const lowestPrice = total
      ? items.reduce(
          (lowest, item) => Math.min(lowest, Number(item.price) || 0),
          Number(items[0].price) || 0
        )
      : 0;

    return {
      total,
      totalValue,
      averagePrice: total ? totalValue / total : 0,
      imageCount,
      withoutImage: total - imageCount,
      highestPrice,
      lowestPrice,
      categoryCount: new Set(
        items.map((item) => item.category?.trim() || "Uncategorized")
      ).size,
    };
  }, [items]);

  // ORDER STATISTICS
  const orderStats = useMemo(() => {
    const count = (status: OrderStatus) =>
      orders.filter((order) => order.status === status).length;

    return {
      total: orders.length,
      pending: count("Pending"),
      preparing: count("Preparing"),
      ready: count("Ready"),
      completed: count("Completed"),
      revenue: orders
        .filter((order) => order.status === "Completed")
        .reduce(
          (sum, order) => sum + Number(order.total_amount || 0),
          0
        ),
    };
  }, [orders]);

  // ANALYTICS
  const analytics = useMemo(() => {
    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);

    let periodStart = new Date(startOfDay);

    if (analyticsPeriod === "weekly") {
      const day = (periodStart.getDay() + 6) % 7;
      periodStart.setDate(periodStart.getDate() - day);
    } else if (analyticsPeriod === "monthly") {
      periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    const elapsed = Math.max(1, now.getTime() - periodStart.getTime());
    const previousStart = new Date(periodStart.getTime() - elapsed);

    const completedOrders = orders.filter(
      (order) => order.status === "Completed"
    );

    const currentOrders = completedOrders.filter((order) => {
      const time = new Date(order.created_at).getTime();
      return (
        Number.isFinite(time) &&
        time >= periodStart.getTime() &&
        time <= now.getTime()
      );
    });

    const previousOrders = completedOrders.filter((order) => {
      const time = new Date(order.created_at).getTime();
      return (
        Number.isFinite(time) &&
        time >= previousStart.getTime() &&
        time < periodStart.getTime()
      );
    });

    const sumRevenue = (list: Order[]) =>
      list.reduce(
        (sum, order) => sum + (Number(order.total_amount) || 0),
        0
      );

    const revenue = sumRevenue(currentOrders);
    const previousRevenue = sumRevenue(previousOrders);

    const revenueChange =
      previousRevenue > 0
        ? ((revenue - previousRevenue) / previousRevenue) * 100
        : revenue > 0
          ? 100
          : 0;

    const unitsSold = currentOrders.reduce(
      (sum, order) =>
        sum +
        order.items.reduce(
          (itemSum, item) => itemSum + (Number(item.quantity) || 0),
          0
        ),
      0
    );

    const dishMap = new Map<
      string,
      { quantity: number; revenue: number }
    >();

    completedOrders.forEach((order) => {
      order.items.forEach((item) => {
        const current = dishMap.get(item.item_name) || {
          quantity: 0,
          revenue: 0,
        };

        current.quantity += Number(item.quantity) || 0;
        current.revenue +=
          (Number(item.price) || 0) * (Number(item.quantity) || 0);

        dishMap.set(item.item_name, current);
      });
    });

    const topDishes = Array.from(dishMap.entries())
      .map(([dishName, values]) => ({ name: dishName, ...values }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    const lastSevenDays = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(startOfDay);
      date.setDate(date.getDate() - (6 - index));

      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const amount = completedOrders
        .filter((order) => {
          const time = new Date(order.created_at).getTime();
          return (
            Number.isFinite(time) &&
            time >= date.getTime() &&
            time < nextDate.getTime()
          );
        })
        .reduce(
          (sum, order) => sum + (Number(order.total_amount) || 0),
          0
        );

      return {
        label: date.toLocaleDateString("en-PK", { weekday: "short" }),
        amount,
      };
    });

    const maxDailyRevenue = Math.max(
      1,
      ...lastSevenDays.map((day) => day.amount)
    );

    return {
      revenue,
      previousRevenue,
      revenueChange,
      orderCount: currentOrders.length,
      averageOrder: currentOrders.length
        ? revenue / currentOrders.length
        : 0,
      unitsSold,
      topDishes,
      lastSevenDays,
      maxDailyRevenue,
      pendingOrders: orders.filter((order) => order.status === "Pending")
        .length,
      statusCounts: ORDER_STATUSES.map((status) => ({
        status,
        count: orders.filter((order) => order.status === status).length,
      })),
    };
  }, [orders, analyticsPeriod]);  // FILTERED MENU
  const filteredItems = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    const result = items.filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(term) ||
        (item.description || "").toLowerCase().includes(term) ||
        (item.category || "Uncategorized").toLowerCase().includes(term);

      const itemPrice = Number(item.price);

      const matchesPrice =
        filter === "all" ||
        (filter === "low" && itemPrice < 500) ||
        (filter === "high" && itemPrice >= 500);

      const matchesCategory =
        categoryFilter === "all" ||
        (item.category?.trim() || "Uncategorized") === categoryFilter;

      return matchesSearch && matchesPrice && matchesCategory;
    });

    return [...result].sort((a, b) => {
      switch (sortBy) {
        case "oldest":
          return a.id - b.id;
        case "price-low":
          return Number(a.price) - Number(b.price);
        case "price-high":
          return Number(b.price) - Number(a.price);
        case "name":
          return a.name.localeCompare(b.name);
        default:
          return b.id - a.id;
      }
    });
  }, [items, searchTerm, filter, categoryFilter, sortBy]);

  // FILTERED ORDERS
  const filteredOrders = useMemo(() => {
    const term = ordersSearch.trim().toLowerCase();

    return orders.filter((order) => {
      const matchesSearch =
        String(order.id).includes(term) ||
        order.customer_name.toLowerCase().includes(term) ||
        order.phone.toLowerCase().includes(term) ||
        order.address.toLowerCase().includes(term) ||
        order.items.some((item) =>
          item.item_name.toLowerCase().includes(term)
        );

      const matchesStatus =
        ordersStatusFilter === "all" ||
        order.status === ordersStatusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [orders, ordersSearch, ordersStatusFilter]);

  // MENU FORM
  function resetForm() {
    setEditingId(null);
    setName("");
    setPrice("");
    setDescription("");
    setImageUrl("");
    setPreviewUrl("");
    setCategory("Uncategorized");
    setManualImage(false);
    setAutoImageLoading(false);
    setImageResults([]);
    setSelectedImageName("");

    const input = document.getElementById(
      "dish-image"
    ) as HTMLInputElement | null;

    if (input) input.value = "";
  }

  function handleEdit(item: MenuItem) {
    setEditingId(item.id);
    setName(item.name);
    setPrice(String(item.price));
    setDescription(item.description || "");
    setImageUrl(item.image_url || "");
    setPreviewUrl(item.image_url || "");
    setCategory(item.category || "Uncategorized");
    setManualImage(false);
    setImageResults([]);
    setSelectedImageName("");
    setActiveTab("menu");
    setSidebarOpen(false);
    setMessage("");
    setError("");

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleImageChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError("");
    setMessage("");

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Only JPG, PNG and WebP images are allowed.");
      e.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Image size must be less than 5 MB.");
      e.target.value = "";
      return;
    }

    setManualImage(true);
    setImageResults([]);
    setSelectedImageName("");

    const localPreview = URL.createObjectURL(file);
    setPreviewUrl(localPreview);
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Image upload failed.");
      }

      setImageUrl(data.image_url);
      setPreviewUrl(data.image_url);
      setMessage("Image uploaded successfully to Cloudinary!");
    } catch (err) {
      setImageUrl("");
      setPreviewUrl("");
      setError(err instanceof Error ? err.message : "Could not upload image.");
    } finally {
      URL.revokeObjectURL(localPreview);
      setUploading(false);
    }
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (uploading || autoImageLoading) {
      setError("Please wait until image processing finishes.");
      return;
    }

    const cleanName = name.trim();
    const cleanCategory = category.trim() || "Uncategorized";
    const numericPrice = Number(price);

    if (!cleanName) {
      setError("Please enter a dish name.");
      return;
    }

    if (!Number.isFinite(numericPrice) || numericPrice <= 0) {
      setError("Please enter a valid price greater than zero.");
      return;
    }

    if (cleanCategory.length > 100) {
      setError("Category cannot exceed 100 characters.");
      return;
    }

    setSubmitting(true);
    setMessage("");
    setError("");

    const isEditing = editingId !== null;

    try {
      const response = await fetch("/api/menu", {
        method: isEditing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingId,
          name: cleanName,
          price,
          description: description.trim(),
          image_url: imageUrl,
          category: cleanCategory,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Menu operation failed.");
      }

      setMessage(
        isEditing
          ? "Menu item updated successfully!"
          : "Menu item added successfully!"
      );

      addActivity(
        isEditing ? "Menu item updated" : "New menu item added",
        `${cleanName} · ${cleanCategory}`
      );

      resetForm();
      await fetchMenu();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: number) {
    if (!window.confirm("Are you sure you want to delete this menu item?")) {
      return;
    }

    const deletedItem = items.find((item) => item.id === id);

    setDeletingId(id);
    setMessage("");
    setError("");

    try {
      const response = await fetch("/api/menu", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Could not delete item.");
      }

      if (editingId === id) resetForm();

      setMessage("Menu item deleted successfully!");
      addActivity("Menu item deleted", deletedItem?.name || `Item #${id}`);

      await fetchMenu();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setDeletingId(null);
    }
  }

  // PASSWORD
  async function handleChangePassword(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage("");
    setError("");

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }

    if (newPassword.length < 10 || newPassword.length > 128) {
      setError("New password must be 10–128 characters.");
      return;
    }

    setChangingPassword(true);

    try {
      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Password change failed.");
      }

      window.alert(
        "Password changed successfully. Please login with your new password."
      );

      router.replace("/login");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to change password."
      );
    } finally {
      setChangingPassword(false);
    }
  }

  // LOGOUT
  async function handleLogout() {
    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });
      if (!response.ok) throw new Error("Logout request failed.");
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      router.replace("/login");
      router.refresh();
    }
  }

  // NAVIGATION
  const navigation: { id: Tab; label: string; icon: string }[] = [
    { id: "overview", label: "Overview", icon: "▦" },
    { id: "menu", label: "Menu Management", icon: "☷" },
    { id: "orders", label: "Orders Management", icon: "🛍" },
    { id: "analytics", label: "Analytics", icon: "▥" },
    { id: "security", label: "Security", icon: "◇" },
    { id: "settings", label: "Settings", icon: "⚙" },
  ];

  function navigate(tab: Tab) {
    setActiveTab(tab);
    setSidebarOpen(false);
    setMessage("");
    setError("");

    if (tab !== "menu") resetForm();
  }

  // INVOICE HELPERS
  function escapeHTML(value: unknown) {
    return String(value ?? "").replace(/[&<>"']/g, (char) => {
      const entities: Record<string, string> = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      };

      return entities[char];
    });
  }

  function printInvoice(order: Order) {
    const printWindow = window.open("", "_blank", "width=850,height=700");

    if (!printWindow) {
      setError("Please allow pop-ups to print the invoice.");
      return;
    }

    const rows = order.items
      .map(
        (item) => `
        <tr>
          <td>${escapeHTML(item.item_name)}</td>
          <td>${item.quantity}</td>
          <td>PKR ${Number(item.price).toLocaleString("en-PK")}</td>
          <td>PKR ${(Number(item.price) * item.quantity).toLocaleString("en-PK")}</td>
        </tr>
      `
      )
      .join("");

    const invoiceHTML = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>SAVORA Invoice - Order #${order.id}</title>
        <style>
          * { box-sizing: border-box; }
          body { margin: 0; padding: 40px; font-family: Arial, sans-serif; color: #25251f; background: white; }
          .invoice { max-width: 760px; margin: auto; }
          .header { display:flex; justify-content:space-between; border-bottom:3px solid #c6aa79; padding-bottom:22px; margin-bottom:28px; }
          .brand { color:#9d8050; font-size:30px; font-weight:bold; letter-spacing:7px; }
          .muted { color:#777; font-size:13px; }
          h2 { margin:0 0 8px; font-size:20px; }
          .details { display:grid; grid-template-columns:1fr 1fr; gap:24px; margin-bottom:30px; }
          .details p { margin:7px 0; font-size:14px; overflow-wrap:anywhere; }
          table { width:100%; border-collapse:collapse; margin-top:18px; }
          th { background:#f2eee6; text-align:left; padding:13px 10px; font-size:12px; }
          td { padding:13px 10px; border-bottom:1px solid #eee; font-size:13px; }
          .total { margin-top:25px; text-align:right; font-size:20px; font-weight:bold; color:#9d8050; }
          .status { display:inline-block; padding:7px 12px; background:#f2eee6; border-radius:20px; font-size:12px; }
          .footer { border-top:1px solid #ddd; margin-top:45px; padding-top:20px; text-align:center; color:#777; font-size:12px; }
          .print-button { display:block; margin:30px auto; padding:12px 25px; background:#25251f; color:white; border:0; border-radius:6px; cursor:pointer; }
          @media print { body { padding:0; } .print-button { display:none; } }
          @media(max-width:600px) { body { padding:18px; } .details { grid-template-columns:1fr; } }
        </style>
      </head>
      <body>
        <div class="invoice">
          <div class="header">
            <div>
              <div class="brand">SAVORA</div>
              <p class="muted">RESTAURANT INVOICE</p>
            </div>
            <div style="text-align:right">
              <h2>INVOICE</h2>
              <p class="muted">Order #${order.id}</p>
              <p class="muted">${escapeHTML(formatDate(order.created_at))}</p>
            </div>
          </div>

          <div class="details">
            <div>
              <h2>Customer Details</h2>
              <p><strong>Name:</strong> ${escapeHTML(order.customer_name)}</p>
              <p><strong>Phone:</strong> ${escapeHTML(order.phone)}</p>
              <p><strong>Address:</strong> ${escapeHTML(order.address)}</p>
            </div>
            <div>
              <h2>Order Information</h2>
              <p><strong>Order ID:</strong> #${order.id}</p>
              <p><strong>Date:</strong> ${escapeHTML(formatDate(order.created_at))}</p>
              <p><strong>Status:</strong> <span class="status">${escapeHTML(order.status)}</span></p>
            </div>
          </div>

          <h2>Order Items</h2>
          <table>
            <thead>
              <tr><th>Item</th><th>Qty</th><th>Unit Price</th><th>Subtotal</th></tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>

          <div class="total">
            Total: PKR ${Number(order.total_amount).toLocaleString("en-PK", {
              maximumFractionDigits: 2,
            })}
          </div>

          <div class="footer">
            <p>Thank you for choosing SAVORA.</p>
            <p>We appreciate your order!</p>
          </div>
        </div>
        <button class="print-button" onclick="window.print()">Print Invoice</button>
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(invoiceHTML);
    printWindow.document.close();
  }

  const statCards = [
    {
      label: "Total Menu Items",
      value: loading ? "..." : String(stats.total),
      description: "Items currently listed",
      icon: "☷",
      color: "text-[#c6aa79]",
    },
    {
      label: "Categories",
      value: loading ? "..." : String(stats.categoryCount),
      description: "Categories in your menu",
      icon: "▤",
      color: "text-purple-400",
    },
    {
      label: "Combined Menu Value",
      value: loading ? "..." : currency(stats.totalValue),
      description: "Sum of listed item prices",
      icon: "₨",
      color: "text-green-400",
    },
    {
      label: "Average Dish Price",
      value: loading ? "..." : currency(stats.averagePrice),
      description: "Average price per item",
      icon: "↗",
      color: "text-blue-400",
    },
    {
      label: "Images Uploaded",
      value: loading ? "..." : `${stats.imageCount}/${stats.total}`,
      description: `${stats.withoutImage} items without images`,
      icon: "▧",
      color: "text-orange-400",
    },
  ];

  return (
    <main className="min-h-screen w-full overflow-x-hidden bg-[#11120f] text-[#eee9df]">
      {/* MOBILE HEADER */}
      <div className="sticky top-0 z-30 lg:hidden flex items-center justify-between gap-3 px-4 sm:px-5 py-4 border-b border-[#c6aa79]/15 bg-[#191a16]/95 backdrop-blur-md">
        <div>
          <p className="text-[#c6aa79] tracking-[5px] text-sm font-semibold">
            SAVORA
          </p>
          <p className="text-xs text-gray-500 mt-1">Admin Panel</p>
        </div>

        <button
          type="button"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-expanded={sidebarOpen}
          aria-controls="savora-admin-sidebar"
          className="shrink-0 border border-[#c6aa79]/30 rounded-lg px-4 py-2.5 text-sm text-[#c6aa79] hover:bg-[#c6aa79]/10 transition"
        >
          {sidebarOpen ? "Close ✕" : "☰ Menu"}
        </button>
      </div>

      <div className="flex min-h-screen w-full">
        {sidebarOpen && (
          <button
            type="button"
            aria-label="Close navigation menu"
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 z-40 bg-black/70 backdrop-blur-[2px] lg:hidden"
          />
        )}

        {/* SIDEBAR */}
        <aside
          id="savora-admin-sidebar"
          aria-label="Admin navigation"
          className={`fixed inset-y-0 left-0 z-50 w-[min(86vw,300px)] overflow-y-auto bg-[#191a16] border-r border-[#c6aa79]/15 p-5 sm:p-6 transition-transform duration-300 ease-in-out ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          } lg:translate-x-0 lg:static lg:z-auto lg:w-[260px] lg:min-h-screen lg:h-screen lg:sticky lg:top-0 lg:shrink-0`}
        >
          <div className="mb-8 lg:mb-12">
            <p className="text-[#c6aa79] tracking-[6px] text-xl font-semibold">
              SAVORA
            </p>
            <p className="text-gray-500 text-xs tracking-[2px] mt-2">
              RESTAURANT MANAGEMENT
            </p>
          </div>

          <p className="text-[10px] text-gray-500 tracking-[3px] mb-4">
            WORKSPACE
          </p>

          <nav className="space-y-2">
            {navigation.map((item) => (
              <button
                key={item.id}
                onClick={() => navigate(item.id)}
                className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl text-sm text-left transition ${
                  activeTab === item.id
                    ? "bg-[#c6aa79] text-[#171713] font-semibold shadow-lg"
                    : "text-gray-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                <span>{item.label}</span>

                {item.id === "orders" && orderStats.pending > 0 && (
                  <span className="ml-auto text-xs bg-red-500 text-white rounded-full px-2 py-1">
                    {orderStats.pending}
                  </span>
                )}
              </button>
            ))}
          </nav>

          <div className="mt-8 lg:mt-12 border-t border-white/10 pt-6">
            <p className="text-[10px] text-gray-500 tracking-[3px] mb-4">
              QUICK LINKS
            </p>

            <button
              onClick={() => router.push("/")}
              className="w-full text-left text-sm text-gray-400 hover:text-[#c6aa79] py-3"
            >
              ↗ View Website
            </button>

            <button
              onClick={handleLogout}
              className="w-full text-left text-sm text-red-400 hover:text-red-300 py-3"
            >
              ↗ Sign Out
            </button>
          </div>

          <div className="mt-8 lg:mt-12 p-4 rounded-xl bg-[#25251f] border border-[#c6aa79]/15">
            <p className="text-[#c6aa79] text-xs tracking-widest">
              SAVORA ADMIN
            </p>
            <p className="text-gray-400 text-xs mt-2">
              Secure management workspace
            </p>
            <div className="flex items-center gap-2 mt-4">
              <span className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-xs text-gray-400">Session active</span>
            </div>
          </div>
        </aside>

        {/* MAIN CONTENT */}
        <div className="flex-1 min-w-0 w-full">
          <header className="hidden lg:flex justify-between items-center px-8 py-5 border-b border-white/10 bg-[#151612]">
            <div>
              <p className="text-xs text-gray-500">SAVORA / ADMINISTRATION</p>
              <h1 className="text-xl font-serif mt-1">
                {navigation.find((item) => item.id === activeTab)?.label}
              </h1>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-xs text-gray-400">Administrator</span>
              <div className="w-10 h-10 rounded-full bg-[#c6aa79] text-[#171713] flex items-center justify-center font-semibold">
                A
              </div>
            </div>
          </header>

          <div className="w-full min-w-0 p-4 sm:p-5 md:p-8 lg:p-10 max-w-[1500px] mx-auto">
            {/* NOTIFICATIONS */}
            {message && (
              <div className="mb-6 border border-green-500/30 bg-green-500/10 text-green-400 p-4 rounded-xl text-sm">
                ✓ {message}
              </div>
            )}

            {error && (
              <div className="mb-6 border border-red-500/30 bg-red-500/10 text-red-400 p-4 rounded-xl text-sm">
                {error}
              </div>
            )}

            {/* OVERVIEW */}
            {activeTab === "overview" && (
              <section>
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-5 mb-8">
                  <div>
                    <p className="text-[#c6aa79] text-xs tracking-[4px]">
                      DASHBOARD OVERVIEW
                    </p>
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif mt-3 break-words">
                      Welcome to SAVORA
                    </h2>
                    <p className="text-gray-500 mt-2 text-sm">
                      Your restaurant management at a glance.
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      fetchMenu(true);
                      fetchOrders(true);
                    }}
                    disabled={refreshing || ordersRefreshing}
                    className="border border-[#c6aa79]/30 text-[#c6aa79] px-5 py-3 rounded-xl text-sm hover:bg-[#c6aa79]/10 disabled:opacity-50"
                  >
                    {refreshing || ordersRefreshing
                      ? "Refreshing..."
                      : "↻ Refresh Dashboard"}
                  </button>
                </div>

                <div className="grid sm:grid-cols-2 xl:grid-cols-5 gap-5">
                  {statCards.map((card) => (
                    <div key={card.label} className={cardClass}>
                      <div className="flex justify-between items-center gap-2">
                        <p className="text-gray-400 text-sm">{card.label}</p>
                        <span className={`text-2xl ${card.color}`}>
                          {card.icon}
                        </span>
                      </div>
                      <h3 className="text-2xl md:text-3xl font-serif mt-6 break-words">
                        {card.value}
                      </h3>
                      <p className="text-xs text-gray-500 mt-3">
                        {card.description}
                      </p>
                    </div>
                  ))}
                </div>

                {/* ORDER OVERVIEW */}
                <div className="mt-8">
                  <div className="flex flex-wrap justify-between items-center gap-3 mb-5">
                    <div>
                      <p className="text-[#c6aa79] text-xs tracking-[3px]">
                        ORDER MANAGEMENT
                      </p>
                      <h3 className="text-xl sm:text-2xl font-serif mt-2">
                        Order Overview
                      </h3>
                    </div>
                    <button
                      onClick={() => navigate("orders")}
                      className="text-sm text-[#c6aa79] hover:underline"
                    >
                      View All Orders →
                    </button>
                  </div>

                  <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
                    {[
                      {
                        label: "Total Orders",
                        value: orderStats.total,
                        color: "text-[#c6aa79]",
                      },
                      {
                        label: "Pending Orders",
                        value: orderStats.pending,
                        color: "text-yellow-400",
                      },
                      {
                        label: "Preparing Orders",
                        value: orderStats.preparing,
                        color: "text-blue-400",
                      },
                      {
                        label: "Completed Orders",
                        value: orderStats.completed,
                        color: "text-green-400",
                      },
                    ].map((card) => (
                      <div key={card.label} className={cardClass}>
                        <p className="text-sm text-gray-400">{card.label}</p>
                        <h3
                          className={`text-3xl font-serif mt-4 ${card.color}`}
                        >
                          {ordersLoading ? "..." : card.value}
                        </h3>
                      </div>
                    ))}
                  </div>

                  <div className={`${cardClass} mt-4`}>
                    <p className="text-xs text-gray-500">
                      REVENUE FROM COMPLETED ORDERS
                    </p>
                    <p className="text-2xl text-green-400 font-serif mt-3">
                      {currency(orderStats.revenue)}
                    </p>
                  </div>
                </div>

                {/* MENU INSIGHTS */}
                <div className="grid lg:grid-cols-2 gap-5 mt-8">
                  <div className={cardClass}>
                    <p className="text-[#c6aa79] text-xs tracking-[3px]">
                      MENU INSIGHTS
                    </p>
                    <h3 className="text-xl sm:text-2xl font-serif mt-2">
                      Menu overview
                    </h3>

                    <div className="space-y-5 mt-7">
                      {[
                        ["Highest priced dish", currency(stats.highestPrice)],
                        ["Lowest priced dish", currency(stats.lowestPrice)],
                        ["Total categories", String(stats.categoryCount)],
                        ["Items with images", String(stats.imageCount)],
                        ["Items without images", String(stats.withoutImage)],
                      ].map(([label, value]) => (
                        <div
                          key={label}
                          className="flex justify-between gap-3 border-b border-white/10 pb-4 last:border-0"
                        >
                          <span className="text-sm text-gray-400">{label}</span>
                          <span className="text-sm font-semibold text-[#c6aa79]">
                            {value}
                          </span>
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={() => navigate("menu")}
                      className="mt-7 w-full border border-[#c6aa79]/30 text-[#c6aa79] py-3 rounded-xl text-sm hover:bg-[#c6aa79]/10"
                    >
                      Open Menu Management →
                    </button>
                  </div>

                  <div className={cardClass}>
                    <p className="text-[#c6aa79] text-xs tracking-[3px]">
                      IMAGE COMPLETION
                    </p>
                    <h3 className="text-xl sm:text-2xl font-serif mt-2">
                      Menu photography
                    </h3>

                    <div className="mt-8">
                      <div className="flex justify-between text-sm mb-3">
                        <span className="text-gray-400">Images available</span>
                        <span className="text-[#c6aa79]">
                          {stats.total > 0
                            ? Math.round(
                                (stats.imageCount / stats.total) * 100
                              )
                            : 0}
                          %
                        </span>
                      </div>

                      <div className="w-full h-3 bg-[#11120f] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#c6aa79] rounded-full transition-all"
                          style={{
                            width: `${
                              stats.total > 0
                                ? (stats.imageCount / stats.total) * 100
                                : 0
                            }%`,
                          }}
                        />
                      </div>

                      <p className="text-xs text-gray-500 mt-4">
                        {stats.imageCount} of {stats.total} menu items have an
                        image.
                      </p>
                    </div>

                    {stats.withoutImage > 0 && (
                      <button
                        onClick={() => {
                          setFilter("all");
                          setCategoryFilter("all");
                          setSearchTerm("");
                          navigate("menu");
                        }}
                        className="mt-7 w-full border border-orange-400/30 text-orange-300 py-3 rounded-xl text-sm hover:bg-orange-400/10"
                      >
                        Review Menu Images →
                      </button>
                    )}

                    {stats.withoutImage === 0 && stats.total > 0 && (
                      <p className="mt-7 text-sm text-green-400">
                        ✓ Every menu item has an image.
                      </p>
                    )}
                  </div>
                </div>

                {/* QUICK ACTIONS */}
                <div className={`${cardClass} mt-8`}>
                  <p className="text-[#c6aa79] text-xs tracking-[3px]">
                    QUICK ACTIONS
                  </p>
                  <h3 className="text-xl sm:text-2xl font-serif mt-2">
                    Manage your restaurant
                  </h3>

                  <div className="grid sm:grid-cols-3 gap-4 mt-6">
                    <button
                      onClick={() => {
                        resetForm();
                        navigate("menu");
                      }}
                      className="text-left p-5 rounded-xl bg-[#c6aa79] text-[#171713] hover:bg-[#ddc397]"
                    >
                      <span className="text-2xl">＋</span>
                      <p className="font-semibold mt-3">Add New Menu Item</p>
                      <p className="text-xs mt-1 opacity-70">
                        Create a new restaurant menu entry
                      </p>
                    </button>

                    <button
                      onClick={() => navigate("menu")}
                      className="text-left p-5 rounded-xl border border-[#c6aa79]/30 hover:bg-white/5"
                    >
                      <span className="text-2xl text-[#c6aa79]">☷</span>
                      <p className="font-semibold mt-3">Manage Menu</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Edit, search and delete menu items
                      </p>
                    </button>

                    <button
                      onClick={() => navigate("orders")}
                      className="text-left p-5 rounded-xl border border-[#c6aa79]/30 hover:bg-white/5"
                    >
                      <span className="text-2xl text-[#c6aa79]">🛍</span>
                      <p className="font-semibold mt-3">Manage Orders</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Review customer orders and update status
                      </p>
                    </button>
                  </div>
                </div>

                {/* ACTIVITY */}
                <div className={`${cardClass} mt-8`}>
                  <p className="text-[#c6aa79] text-xs tracking-[3px]">
                    ACTIVITY LOG
                  </p>
                  <h3 className="text-xl font-serif mt-2">Recent Activity</h3>

                  {activities.length === 0 ? (
                    <p className="text-sm text-gray-500 mt-6">
                      No recent activity in this session.
                    </p>
                  ) : (
                    <div className="mt-6 space-y-4">
                      {activities.map((activity) => (
                        <div
                          key={activity.id}
                          className="flex justify-between gap-4 border-b border-white/5 pb-4 last:border-0"
                        >
                          <div>
                            <p className="text-sm font-medium">
                              {activity.title}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {activity.detail}
                            </p>
                          </div>
                          <span className="text-xs text-gray-500 whitespace-nowrap">
                            {activity.time}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* MENU MANAGEMENT */}
            {activeTab === "menu" && (
              <section>
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-5 mb-8">
                  <div>
                    <p className="text-[#c6aa79] text-xs tracking-[4px]">
                      RESTAURANT CATALOG
                    </p>
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif mt-3">
                      Menu Management
                    </h2>
                    <p className="text-gray-500 text-sm mt-2">
                      Add, update, search and manage your menu items.
                    </p>
                  </div>
                  <div className="text-sm text-gray-400">
                    Total items:{" "}
                    <span className="text-[#c6aa79] font-semibold">
                      {items.length}
                    </span>
                  </div>
                </div>

                <div className="grid xl:grid-cols-3 gap-6">
                  {/* FORM */}
                  <div className={`${cardClass} xl:col-span-1 h-fit`}>
                    <p className="text-[#c6aa79] text-xs tracking-[3px]">
                      {editingId !== null ? "UPDATE ITEM" : "NEW ENTRY"}
                    </p>
                    <h3 className="text-2xl font-serif mt-2 mb-6">
                      {editingId !== null ? "Edit Menu Item" : "Add Menu Item"}
                    </h3>

                    <form onSubmit={handleSubmit} className="space-y-5">
                      <div>
                        <label className="text-xs text-gray-400 block mb-2">
                          ITEM NAME
                        </label>
                        <input
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="e.g. Chicken Burger"
                          required
                          maxLength={100}
                          className={inputClass}
                        />
                      </div>

                      <div>
                        <label className="text-xs text-gray-400 block mb-2">
                          CATEGORY
                        </label>
                        <input
                          list="savora-categories"
                          value={category}
                          onChange={(e) => setCategory(e.target.value)}
                          placeholder="Select or type a category"
                          maxLength={100}
                          required
                          className={inputClass}
                        />
                        <datalist id="savora-categories">
                          {categories.map((cat) => (
                            <option key={cat} value={cat} />
                          ))}
                        </datalist>
                      </div>

                      <div>
                        <label className="text-xs text-gray-400 block mb-2">
                          PRICE (PKR)
                        </label>
                        <input
                          type="number"
                          min="0.01"
                          step="0.01"
                          value={price}
                          onChange={(e) => setPrice(e.target.value)}
                          placeholder="450"
                          required
                          className={inputClass}
                        />
                      </div>

                      <div>
                        <label className="text-xs text-gray-400 block mb-2">
                          DESCRIPTION
                        </label>
                        <textarea
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          placeholder="Describe your menu item..."
                          rows={4}
                          maxLength={1000}
                          className={inputClass}
                        />
                        <p className="text-right text-[10px] text-gray-600 mt-1">
                          {description.length}/1000
                        </p>
                      </div>

                      {/* AUTOMATIC / MANUAL IMAGE */}
                      <div>
                        <label className="text-xs text-gray-400 block mb-2">
                          DISH IMAGE
                        </label>

                        <div className="mb-3 rounded-xl border border-[#c6aa79]/20 bg-[#11120f] p-3">
                          <p className="text-xs text-[#c6aa79] font-semibold">
                            AUTOMATIC IMAGE SEARCH
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            Enter a dish name to find matching images. Select
                            the correct image below.
                          </p>

                          {autoImageLoading && (
                            <p className="text-xs text-yellow-400 mt-3">
                              Searching dish images...
                            </p>
                          )}

                          {!autoImageLoading && imageResults.length > 0 && (
                            <div className="mt-4">
                              <p className="text-xs text-gray-400 mb-3">
                                {selectedImageName
                                  ? `Selected: ${selectedImageName}`
                                  : "Choose the correct dish image:"}
                              </p>

                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {imageResults.map((result) => {
                                  const selected =
                                    imageUrl === result.strMealThumb &&
                                    !manualImage;

                                  return (
                                    <button
                                      key={result.idMeal}
                                      type="button"
                                      onClick={() => {
                                        setManualImage(false);
                                        setImageUrl(result.strMealThumb);
                                        setPreviewUrl(result.strMealThumb);
                                        setSelectedImageName(result.strMeal);
                                        setMessage(
                                          `Image selected: ${result.strMeal}`
                                        );
                                        setError("");
                                      }}
                                      className={`overflow-hidden rounded-xl border text-left transition ${
                                        selected
                                          ? "border-[#c6aa79] ring-2 ring-[#c6aa79]/40"
                                          : "border-white/10 hover:border-[#c6aa79]/60"
                                      }`}
                                    >
                                      <img
                                        src={result.strMealThumb}
                                        alt={result.strMeal}
                                        className="w-full h-24 object-cover"
                                      />
                                      <span className="block p-2 text-[11px] text-gray-300 truncate">
                                        {result.strMeal}
                                      </span>
                                      {selected && (
                                        <span className="block px-2 pb-2 text-[10px] text-green-400">
                                          ✓ Selected
                                        </span>
                                      )}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {!autoImageLoading &&
                            imageResults.length === 0 &&
                            name.trim() &&
                            !editingId &&
                            !manualImage &&
                            !imageUrl && (
                              <p className="text-xs text-gray-500 mt-3">
                                No suggestions yet. Try another dish name or
                                upload an image below.
                              </p>
                            )}
                        </div>

                        <label
                          htmlFor="dish-image"
                          className="flex flex-col items-center justify-center w-full min-h-[110px] border border-dashed border-[#c6aa79]/40 rounded-xl bg-[#11120f] cursor-pointer hover:bg-white/5 p-4"
                        >
                          <span className="text-2xl text-[#c6aa79]">↑</span>
                          <span className="text-sm text-gray-300 mt-2">
                            {uploading
                              ? "Uploading image..."
                              : "Choose or replace dish image"}
                          </span>
                          <span className="text-xs text-gray-500 mt-1">
                            Manual upload: JPG, PNG or WebP · Max 5 MB
                          </span>
                          <input
                            id="dish-image"
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            onChange={handleImageChange}
                            disabled={uploading || submitting}
                            className="hidden"
                          />
                        </label>

                        {previewUrl && (
                          <div className="mt-4">
                            <p className="text-xs text-gray-400 mb-2">
                              IMAGE PREVIEW
                            </p>
                            <div className="overflow-hidden rounded-xl border border-[#c6aa79]/20">
                              <img
                                src={previewUrl}
                                alt="Dish preview"
                                className="w-full h-44 object-cover"
                              />
                            </div>

                            {imageUrl && (
                              <p className="text-xs text-green-400 mt-2">
                                ✓{" "}
                                {manualImage
                                  ? "Image uploaded to Cloudinary"
                                  : selectedImageName
                                    ? `Selected: ${selectedImageName}`
                                    : "Dish image selected automatically"}
                              </p>
                            )}
                          </div>
                        )}

                        {manualImage && (
                          <button
                            type="button"
                            onClick={() => {
                              setManualImage(false);
                              setImageUrl("");
                              setPreviewUrl("");
                              setImageResults([]);
                              setSelectedImageName("");

                              const fileInput = document.getElementById(
                                "dish-image"
                              ) as HTMLInputElement | null;

                              if (fileInput) fileInput.value = "";
                            }}
                            className="text-xs text-[#c6aa79] mt-3 hover:underline"
                          >
                            Use automatic image selection again
                          </button>
                        )}
                      </div>

                      <button
                        type="submit"
                        disabled={submitting || uploading || autoImageLoading}
                        className="w-full bg-[#c6aa79] text-[#171713] py-3 rounded-xl text-sm font-semibold hover:bg-[#ddc397] disabled:opacity-50"
                      >
                        {uploading
                          ? "Uploading Image..."
                          : autoImageLoading
                            ? "Finding Dish Image..."
                            : submitting
                              ? "Please wait..."
                              : editingId !== null
                                ? "Update Menu Item"
                                : "＋ Add Menu Item"}
                      </button>

                      {editingId !== null && (
                        <button
                          type="button"
                          onClick={resetForm}
                          className="w-full border border-white/20 text-gray-300 py-3 rounded-xl text-sm hover:bg-white/5"
                        >
                          Cancel Editing
                        </button>
                      )}
                    </form>
                  </div>

                  {/* MENU LIST */}
                  <div className={`${cardClass} xl:col-span-2`}>
                    <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
                      <div>
                        <h3 className="text-2xl font-serif">
                          All Menu Items
                        </h3>
                        <p className="text-xs text-gray-500 mt-2">
                          Showing {filteredItems.length} of {items.length} items
                        </p>
                      </div>
                      <button
                        onClick={() => fetchMenu(true)}
                        disabled={refreshing}
                        className="border border-[#c6aa79]/30 text-[#c6aa79] px-4 py-2 rounded-lg text-xs disabled:opacity-50"
                      >
                        {refreshing ? "Refreshing..." : "↻ Refresh"}
                      </button>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-3 mb-4">
                      <input
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search by name, description or category..."
                        className={`${inputClass} sm:col-span-2`}
                      />

                      <select
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        className={inputClass}
                      >
                        <option value="all">All Categories</option>
                        {categories.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>

                      <select
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        className={inputClass}
                      >
                        <option value="all">All Prices</option>
                        <option value="low">Below PKR 500</option>
                        <option value="high">PKR 500 and above</option>
                      </select>

                      <select
                        value={sortBy}
                        onChange={(e) =>
                          setSortBy(e.target.value as SortOption)
                        }
                        className={`${inputClass} sm:col-span-2`}
                      >
                        <option value="newest">Newest First</option>
                        <option value="oldest">Oldest First</option>
                        <option value="price-low">Price: Low to High</option>
                        <option value="price-high">Price: High to Low</option>
                        <option value="name">Name: A to Z</option>
                      </select>
                    </div>

                    {(searchTerm ||
                      filter !== "all" ||
                      categoryFilter !== "all" ||
                      sortBy !== "newest") && (
                      <button
                        onClick={() => {
                          setSearchTerm("");
                          setFilter("all");
                          setCategoryFilter("all");
                          setSortBy("newest");
                        }}
                        className="text-xs text-[#c6aa79] hover:underline mb-5"
                      >
                        Clear search and filters
                      </button>
                    )}

                    {loading ? (
                      <p className="text-gray-500 text-sm py-8">
                        Loading menu...
                      </p>
                    ) : filteredItems.length === 0 ? (
                      <div className="text-center py-12 border border-dashed border-white/10 rounded-xl">
                        <p className="text-3xl text-gray-600">☷</p>
                        <p className="text-gray-400 text-sm mt-4">
                          No matching menu items found.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {filteredItems.map((item) => (
                          <div
                            key={item.id}
                            className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-white/10 hover:border-[#c6aa79]/30"
                          >
                            <div className="flex items-center gap-4 min-w-0">
                              {item.image_url ? (
                                <img
                                  src={item.image_url}
                                  alt={item.name}
                                  className="w-20 h-20 rounded-xl object-cover shrink-0"
                                />
                              ) : (
                                <div className="w-20 h-20 rounded-xl bg-[#11120f] border border-white/10 flex items-center justify-center text-[#c6aa79] text-2xl shrink-0">
                                  ☷
                                </div>
                              )}

                              <div className="min-w-0">
                                <h4 className="font-semibold break-words">
                                  {item.name}
                                </h4>
                                <span className="inline-block mt-2 text-[10px] px-2 py-1 rounded-full bg-[#c6aa79]/10 text-[#c6aa79] border border-[#c6aa79]/20">
                                  {item.category || "Uncategorized"}
                                </span>
                                <p className="text-xs text-gray-500 mt-2 line-clamp-2">
                                  {item.description || "No description"}
                                </p>
                                <p className="text-[#c6aa79] text-sm font-semibold mt-3">
                                  {currency(Number(item.price) || 0)}
                                </p>
                                <span
                                  className={`inline-block mt-2 text-[10px] px-2 py-1 rounded-full ${
                                    item.image_url
                                      ? "bg-green-500/10 text-green-400"
                                      : "bg-orange-500/10 text-orange-400"
                                  }`}
                                >
                                  {item.image_url
                                    ? "Image available"
                                    : "No image"}
                                </span>
                              </div>
                            </div>

                            <div className="flex gap-2 shrink-0">
                              <button
                                onClick={() => handleEdit(item)}
                                className="border border-[#c6aa79]/40 text-[#c6aa79] px-4 py-2 rounded-lg text-xs"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDelete(item.id)}
                                disabled={deletingId === item.id}
                                className="border border-red-500/30 text-red-400 px-4 py-2 rounded-lg text-xs disabled:opacity-50"
                              >
                                {deletingId === item.id
                                  ? "Deleting..."
                                  : "Delete"}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </section>
            )}            {/* ANALYTICS */}
            {activeTab === "analytics" && (
              <section>
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-5 mb-8">
                  <div>
                    <p className="text-[#c6aa79] text-xs tracking-[4px]">
                      BUSINESS PERFORMANCE
                    </p>
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif mt-3">
                      Sales Analytics
                    </h2>
                    <p className="text-gray-500 text-sm mt-2">
                      Understand completed sales, popular dishes and order
                      trends.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {(
                      [
                        ["daily", "Today"],
                        ["weekly", "This Week"],
                        ["monthly", "This Month"],
                      ] as [AnalyticsPeriod, string][]
                    ).map(([period, label]) => (
                      <button
                        key={period}
                        onClick={() => setAnalyticsPeriod(period)}
                        className={`px-4 py-2.5 rounded-xl text-sm border transition ${
                          analyticsPeriod === period
                            ? "bg-[#c6aa79] text-[#171713] border-[#c6aa79] font-semibold"
                            : "border-[#c6aa79]/30 text-gray-400 hover:text-[#c6aa79]"
                        }`}
                      >
                        {label}
                      </button>
                    ))}

                    <button
                      onClick={() => fetchOrders(true)}
                      disabled={ordersRefreshing}
                      className="px-4 py-2.5 rounded-xl text-sm border border-[#c6aa79]/30 text-[#c6aa79] disabled:opacity-50"
                    >
                      {ordersRefreshing ? "Refreshing..." : "↻ Refresh"}
                    </button>
                  </div>
                </div>

                {ordersLoading ? (
                  <div className={`${cardClass} text-center text-gray-400`}>
                    Loading analytics...
                  </div>
                ) : (
                  <>
                    <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
                      <div className={cardClass}>
                        <p className="text-sm text-gray-400">
                          Completed Sales
                        </p>
                        <p className="text-2xl md:text-3xl font-serif text-green-400 mt-4 break-words">
                          {currency(analytics.revenue)}
                        </p>
                        <p className="text-xs text-gray-500 mt-3">
                          {analytics.revenueChange >= 0 ? "↑" : "↓"}{" "}
                          {Math.abs(analytics.revenueChange).toFixed(1)}% vs
                          previous period
                        </p>
                      </div>

                      <div className={cardClass}>
                        <p className="text-sm text-gray-400">
                          Completed Orders
                        </p>
                        <p className="text-3xl font-serif text-[#c6aa79] mt-4">
                          {analytics.orderCount}
                        </p>
                        <p className="text-xs text-gray-500 mt-3">
                          In selected period
                        </p>
                      </div>

                      <div className={cardClass}>
                        <p className="text-sm text-gray-400">
                          Average Order Value
                        </p>
                        <p className="text-2xl md:text-3xl font-serif mt-4 break-words">
                          {currency(analytics.averageOrder)}
                        </p>
                        <p className="text-xs text-gray-500 mt-3">
                          Sales divided by completed orders
                        </p>
                      </div>

                      <div className={cardClass}>
                        <p className="text-sm text-gray-400">Items Sold</p>
                        <p className="text-3xl font-serif text-purple-400 mt-4">
                          {analytics.unitsSold}
                        </p>
                        <p className="text-xs text-gray-500 mt-3">
                          Units in completed orders this period
                        </p>
                      </div>
                    </div>

                    <div className="grid xl:grid-cols-3 gap-5 mt-6">
                      <div className={`${cardClass} xl:col-span-2`}>
                        <p className="text-[#c6aa79] text-xs tracking-[3px]">
                          REVENUE TREND
                        </p>
                        <h3 className="text-xl sm:text-2xl font-serif mt-2">
                          Last 7 Days
                        </h3>

                        <div className="h-56 min-w-0 flex items-end gap-2 sm:gap-5 mt-8 border-b border-white/10 pb-2">
                          {analytics.lastSevenDays.map((day, index) => (
                            <div
                              key={`${day.label}-${index}`}
                              className="flex-1 h-full flex flex-col justify-end items-center gap-2 min-w-0"
                            >
                              <span className="text-[10px] text-gray-400 text-center break-all">
                                {day.amount > 0
                                  ? currency(day.amount)
                                  : "—"}
                              </span>
                              <div
                                className="w-full max-w-12 rounded-t-md bg-[#c6aa79]/80 hover:bg-[#ddc397] transition-all min-h-1"
                                style={{
                                  height: `${Math.max(
                                    day.amount > 0 ? 5 : 1,
                                    (day.amount /
                                      analytics.maxDailyRevenue) *
                                      100
                                  )}%`,
                                }}
                                title={`${day.label}: ${currency(day.amount)}`}
                              />
                              <span className="text-xs text-gray-500">
                                {day.label}
                              </span>
                            </div>
                          ))}
                        </div>

                        <p className="text-xs text-gray-500 mt-4">
                          Revenue is counted only when an order status is
                          Completed.
                        </p>
                      </div>

                      <div className={cardClass}>
                        <p className="text-[#c6aa79] text-xs tracking-[3px]">
                          ORDER STATUS
                        </p>
                        <h3 className="text-xl sm:text-2xl font-serif mt-2">
                          Order Breakdown
                        </h3>

                        <div className="space-y-5 mt-7">
                          {analytics.statusCounts.map((item) => {
                            const percentage = orders.length
                              ? (item.count / orders.length) * 100
                              : 0;

                            const barColor =
                              item.status === "Pending"
                                ? "bg-yellow-400"
                                : item.status === "Preparing"
                                  ? "bg-blue-400"
                                  : item.status === "Ready"
                                    ? "bg-purple-400"
                                    : "bg-green-400";

                            return (
                              <div key={item.status}>
                                <div className="flex justify-between gap-3 text-sm mb-2">
                                  <span className="text-gray-400">
                                    {item.status}
                                  </span>
                                  <span className="text-[#c6aa79]">
                                    {item.count}
                                  </span>
                                </div>
                                <div className="w-full h-2 bg-[#11120f] rounded-full overflow-hidden">
                                  <div
                                    className={`h-full ${barColor} rounded-full`}
                                    style={{ width: `${percentage}%` }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        <div className="mt-7 pt-5 border-t border-white/10">
                          <p className="text-xs text-gray-500">
                            ORDERS NEEDING ATTENTION
                          </p>
                          <p className="text-3xl font-serif text-yellow-400 mt-2">
                            {analytics.pendingOrders}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Currently pending
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className={`${cardClass} mt-6`}>
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-[#c6aa79] text-xs tracking-[3px]">
                            MENU PERFORMANCE
                          </p>
                          <h3 className="text-xl sm:text-2xl font-serif mt-2">
                            Top Selling Dishes
                          </h3>
                        </div>
                        <span className="text-xs text-gray-500">
                          Based on completed orders
                        </span>
                      </div>

                      {analytics.topDishes.length === 0 ? (
                        <p className="text-sm text-gray-500 mt-6">
                          No completed order items available yet.
                        </p>
                      ) : (
                        <div className="mt-6 overflow-x-auto">
                          <table className="w-full text-sm text-left">
                            <thead className="text-xs text-gray-500 border-b border-white/10">
                              <tr>
                                <th className="py-3 pr-4">Dish</th>
                                <th className="py-3 px-4">Units Sold</th>
                                <th className="py-3 pl-4 text-right">
                                  Sales Value
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {analytics.topDishes.map((dish, index) => (
                                <tr
                                  key={dish.name}
                                  className="border-b border-white/5 last:border-0"
                                >
                                  <td className="py-4 pr-4">
                                    <span className="text-[#c6aa79] mr-2">
                                      #{index + 1}
                                    </span>
                                    {dish.name}
                                  </td>
                                  <td className="py-4 px-4">
                                    {dish.quantity}
                                  </td>
                                  <td className="py-4 pl-4 text-right text-[#c6aa79] whitespace-nowrap">
                                    {currency(dish.revenue)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </section>
            )}

            {/* ORDERS MANAGEMENT */}
            {activeTab === "orders" && (
              <section>
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-5 mb-8">
                  <div>
                    <p className="text-[#c6aa79] text-xs tracking-[4px]">
                      CUSTOMER ORDERS
                    </p>
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif mt-3">
                      Orders Management
                    </h2>
                    <p className="text-gray-500 text-sm mt-2">
                      View customer orders and manage their progress.
                    </p>
                  </div>

                  <button
                    onClick={() => fetchOrders(true)}
                    disabled={ordersRefreshing}
                    className="border border-[#c6aa79]/30 text-[#c6aa79] px-5 py-3 rounded-xl text-sm disabled:opacity-50"
                  >
                    {ordersRefreshing ? "Refreshing..." : "↻ Refresh Orders"}
                  </button>
                </div>

                <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
                  {[
                    {
                      label: "Total Orders",
                      value: orderStats.total,
                      color: "text-[#c6aa79]",
                    },
                    {
                      label: "Pending",
                      value: orderStats.pending,
                      color: "text-yellow-400",
                    },
                    {
                      label: "Preparing",
                      value: orderStats.preparing,
                      color: "text-blue-400",
                    },
                    {
                      label: "Completed",
                      value: orderStats.completed,
                      color: "text-green-400",
                    },
                  ].map((card) => (
                    <div key={card.label} className={cardClass}>
                      <p className="text-sm text-gray-400">{card.label}</p>
                      <h3
                        className={`text-3xl font-serif mt-4 ${card.color}`}
                      >
                        {ordersLoading ? "..." : card.value}
                      </h3>
                    </div>
                  ))}
                </div>

                <div className={`${cardClass} mb-8`}>
                  <p className="text-xs text-gray-500 tracking-widest">
                    COMPLETED ORDERS REVENUE
                  </p>
                  <h3 className="text-3xl font-serif text-green-400 mt-3">
                    {currency(orderStats.revenue)}
                  </h3>
                  <p className="text-xs text-gray-500 mt-2">
                    Calculated from completed orders only.
                  </p>
                </div>

                {/* SEARCH AND FILTER */}
                <div className={`${cardClass} mb-6`}>
                  <div className="grid md:grid-cols-2 gap-4">
                    <input
                      value={ordersSearch}
                      onChange={(e) => setOrdersSearch(e.target.value)}
                      placeholder="Search order ID, customer, phone or dish..."
                      className={inputClass}
                    />
                    <select
                      value={ordersStatusFilter}
                      onChange={(e) => setOrdersStatusFilter(e.target.value)}
                      className={inputClass}
                    >
                      <option value="all">All Order Statuses</option>
                      {ORDER_STATUSES.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex justify-between items-center mt-4 gap-3">
                    <p className="text-xs text-gray-500">
                      Showing {filteredOrders.length} of {orders.length} orders
                    </p>
                    {(ordersSearch || ordersStatusFilter !== "all") && (
                      <button
                        onClick={() => {
                          setOrdersSearch("");
                          setOrdersStatusFilter("all");
                        }}
                        className="text-xs text-[#c6aa79] hover:underline"
                      >
                        Clear filters
                      </button>
                    )}
                  </div>
                </div>

                {/* ORDERS LIST */}
                {ordersLoading ? (
                  <div className={`${cardClass} text-center text-gray-400`}>
                    Loading customer orders...
                  </div>
                ) : filteredOrders.length === 0 ? (
                  <div className={`${cardClass} text-center`}>
                    <p className="text-4xl">🛍</p>
                    <h3 className="text-xl font-serif mt-4">No Orders Found</h3>
                    <p className="text-sm text-gray-500 mt-2">
                      New customer orders will appear here.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-5">
                    {filteredOrders.map((order) => (
                      <article
                        key={order.id}
                        className="bg-[#1c1d18] border border-[#c6aa79]/15 rounded-2xl overflow-hidden"
                      >
                        <div className="p-5 md:p-6 border-b border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div>
                            <div className="flex flex-wrap items-center gap-3">
                              <h3 className="text-xl font-serif">
                                Order #{order.id}
                              </h3>
                              <span
                                className={`text-xs px-3 py-1.5 rounded-full border ${statusStyle(
                                  order.status
                                )}`}
                              >
                                {order.status}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 mt-2">
                              {formatDate(order.created_at)}
                            </p>
                          </div>

                          <div className="md:text-right">
                            <p className="text-xs text-gray-500">ORDER TOTAL</p>
                            <p className="text-2xl text-[#c6aa79] font-serif mt-1">
                              {currency(Number(order.total_amount) || 0)}
                            </p>
                            <button
                              onClick={() => setSelectedOrder(order)}
                              className="mt-3 border border-[#c6aa79]/40 text-[#c6aa79] px-4 py-2 rounded-lg text-xs hover:bg-[#c6aa79]/10"
                            >
                              View Details
                            </button>
                          </div>
                        </div>

                        <div className="p-5 md:p-6 grid md:grid-cols-2 gap-6">
                          <div>
                            <p className="text-[#c6aa79] text-xs tracking-widest mb-4">
                              CUSTOMER INFORMATION
                            </p>
                            <div className="space-y-4">
                              <div>
                                <p className="text-xs text-gray-500">
                                  Customer Name
                                </p>
                                <p className="text-sm mt-1">
                                  {order.customer_name}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500">
                                  Phone Number
                                </p>
                                <p className="text-sm mt-1">{order.phone}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500">
                                  Delivery Address
                                </p>
                                <p className="text-sm mt-1 break-words">
                                  {order.address}
                                </p>
                              </div>
                            </div>
                          </div>

                          <div>
                            <p className="text-[#c6aa79] text-xs tracking-widest mb-4">
                              ORDERED ITEMS
                            </p>
                            <div className="space-y-3">
                              {order.items.map((item) => (
                                <div
                                  key={item.id}
                                  className="flex justify-between gap-3 border-b border-white/5 pb-3"
                                >
                                  <div className="min-w-0">
                                    <p className="text-sm font-medium">
                                      {item.item_name}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">
                                      Quantity: {item.quantity} ×{" "}
                                      {currency(Number(item.price) || 0)}
                                    </p>
                                  </div>
                                  <p className="text-sm text-[#c6aa79] whitespace-nowrap">
                                    {currency(
                                      Number(item.price) * item.quantity
                                    )}
                                  </p>
                                </div>
                              ))}
                            </div>

                            <div className="flex justify-between mt-4 pt-3 border-t border-white/10">
                              <span className="text-sm text-gray-400">
                                Total Amount
                              </span>
                              <span className="text-lg font-semibold text-[#c6aa79]">
                                {currency(Number(order.total_amount) || 0)}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="p-5 md:p-6 bg-[#151612] border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div>
                            <p className="text-xs text-gray-500 tracking-widest">
                              UPDATE ORDER STATUS
                            </p>
                            <p className="text-sm text-gray-300 mt-1">
                              Current status: {order.status}
                            </p>
                          </div>

                          <select
                            value={order.status}
                            disabled={updatingOrderId === order.id}
                            onChange={(e) =>
                              handleOrderStatusChange(
                                order.id,
                                e.target.value as OrderStatus
                              )
                            }
                            className="w-full sm:w-56 bg-[#11120f] border border-[#c6aa79]/30 rounded-xl p-3 text-sm outline-none focus:border-[#c6aa79] disabled:opacity-50"
                          >
                            {ORDER_STATUSES.map((status) => (
                              <option key={status} value={status}>
                                {status}
                              </option>
                            ))}
                          </select>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </section>
            )}

            {/* SECURITY */}
            {activeTab === "security" && (
              <section>
                <div className="mb-8">
                  <p className="text-[#c6aa79] text-xs tracking-[4px]">
                    ACCOUNT PROTECTION
                  </p>
                  <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif mt-3">
                    Security Center
                  </h2>
                  <p className="text-gray-500 text-sm mt-2">
                    Manage your administrator account security.
                  </p>
                </div>

                <div className="max-w-3xl bg-[#1c1d18] border border-[#c6aa79]/15 rounded-2xl p-6 md:p-8">
                  <div className="flex items-center gap-4 mb-7">
                    <div className="w-14 h-14 rounded-xl bg-[#c6aa79]/10 flex items-center justify-center text-2xl text-[#c6aa79]">
                      ◇
                    </div>
                    <div>
                      <h3 className="text-xl font-serif">
                        Change Administrator Password
                      </h3>
                      <p className="text-xs text-gray-500 mt-1">
                        Update your SAVORA account password.
                      </p>
                    </div>
                  </div>

                  <form onSubmit={handleChangePassword} className="space-y-5">
                    <div>
                      <label className="text-xs text-gray-400 block mb-2">
                        CURRENT PASSWORD
                      </label>
                      <input
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        required
                        autoComplete="current-password"
                        className={inputClass}
                        placeholder="Enter current password"
                      />
                    </div>

                    <div>
                      <label className="text-xs text-gray-400 block mb-2">
                        NEW PASSWORD
                      </label>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        minLength={10}
                        maxLength={128}
                        autoComplete="new-password"
                        className={inputClass}
                        placeholder="Enter new password (minimum 10 characters)"
                      />
                    </div>

                    <div>
                      <label className="text-xs text-gray-400 block mb-2">
                        CONFIRM NEW PASSWORD
                      </label>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        minLength={10}
                        maxLength={128}
                        autoComplete="new-password"
                        className={inputClass}
                        placeholder="Confirm new password"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={changingPassword}
                      className="w-full bg-[#c6aa79] text-[#171713] py-3 rounded-xl text-sm font-semibold hover:bg-[#ddc397] disabled:opacity-50"
                    >
                      {changingPassword
                        ? "Updating Password..."
                        : "Update Password"}
                    </button>
                  </form>

                  <div className="mt-7 bg-[#11120f] border border-[#c6aa79]/15 rounded-xl p-5">
                    <h4 className="text-sm font-medium">
                      Security Recommendations
                    </h4>
                    <ul className="text-xs text-gray-500 mt-4 space-y-3">
                      <li>✓ Use a unique password.</li>
                      <li>✓ Never share your login credentials.</li>
                      <li>✓ Log out when using a shared computer.</li>
                      <li>✓ Keep database credentials private.</li>
                    </ul>
                  </div>
                </div>
              </section>
            )}

            {/* SETTINGS */}
            {activeTab === "settings" && (
              <section>
                <div className="mb-8">
                  <p className="text-[#c6aa79] text-xs tracking-[4px]">
                    PREFERENCES
                  </p>
                  <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif mt-3">
                    Settings
                  </h2>
                  <p className="text-gray-500 text-sm mt-2">
                    SAVORA dashboard information and preferences.
                  </p>
                </div>

                <div className="max-w-3xl space-y-5">
                  <div className={cardClass}>
                    <h3 className="text-xl font-serif">
                      Restaurant Information
                    </h3>

                    <div className="mt-6 space-y-5">
                      {[
                        ["Restaurant Name", "SAVORA"],
                        ["Platform", "Next.js"],
                        ["Database", "NeonDB PostgreSQL"],
                        ["Dashboard Theme", "Charcoal & Gold"],
                      ].map(([label, value]) => (
                        <div
                          key={label}
                          className="flex justify-between gap-4 border-b border-white/10 pb-4 last:border-0"
                        >
                          <span className="text-sm text-gray-500">
                            {label}
                          </span>
                          <span className="text-sm">{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className={cardClass}>
                    <h3 className="text-xl font-serif">Website Access</h3>
                    <p className="text-sm text-gray-500 mt-3">
                      Your public restaurant website remains accessible
                      without administrator login. Menu changes are managed
                      through the protected dashboard.
                    </p>
                    <button
                      onClick={() => router.push("/")}
                      className="mt-5 border border-[#c6aa79]/40 text-[#c6aa79] px-5 py-3 rounded-xl text-sm hover:bg-[#c6aa79]/10"
                    >
                      Visit Public Website ↗
                    </button>
                  </div>
                </div>
              </section>
            )}

            {/* FOOTER */}
            <footer className="mt-12 pt-6 border-t border-white/10 flex flex-wrap justify-between gap-3">
              <p className="text-xs text-gray-600">
                © 2026 SAVORA Restaurant Management
              </p>
              <p className="text-xs text-gray-600">Crafted with care.</p>
            </footer>
          </div>
        </div>
      </div>

      {/* ORDER DETAILS MODAL */}
      {selectedOrder && (
        <div
          className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4"
          onClick={() => setSelectedOrder(null)}
        >
          <div
            className="bg-[#1c1d18] border border-[#c6aa79]/30 rounded-2xl w-full max-w-3xl max-h-[92vh] max-h-[92dvh] overflow-y-auto overscroll-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-[#1c1d18] border-b border-white/10 p-5 md:p-6 flex justify-between items-center gap-4">
              <div>
                <p className="text-[#c6aa79] text-xs tracking-[3px]">
                  SAVORA ORDER DETAILS
                </p>
                <h2 className="text-xl sm:text-2xl font-serif mt-2 break-words">
                  Order #{selectedOrder.id}
                </h2>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="w-9 h-9 rounded-lg border border-white/10 text-gray-400 hover:text-white hover:bg-white/5"
                aria-label="Close order details"
              >
                ✕
              </button>
            </div>

            <div className="p-5 md:p-7 space-y-7">
              <div className="grid sm:grid-cols-2 gap-5">
                <div className="bg-[#11120f] rounded-xl p-5">
                  <p className="text-xs text-gray-500 tracking-widest">
                    CUSTOMER
                  </p>
                  <h3 className="text-lg font-semibold mt-3">
                    {selectedOrder.customer_name}
                  </h3>
                  <p className="text-sm text-gray-400 mt-2">
                    {selectedOrder.phone}
                  </p>
                  <p className="text-sm text-gray-400 mt-3 break-words">
                    {selectedOrder.address}
                  </p>
                </div>

                <div className="bg-[#11120f] rounded-xl p-5">
                  <p className="text-xs text-gray-500 tracking-widest">
                    ORDER INFORMATION
                  </p>
                  <p className="text-sm mt-4">
                    Order ID: #{selectedOrder.id}
                  </p>
                  <p className="text-sm text-gray-400 mt-3">
                    {formatDate(selectedOrder.created_at)}
                  </p>
                  <span
                    className={`inline-block mt-4 text-xs px-3 py-2 rounded-full border ${statusStyle(
                      selectedOrder.status
                    )}`}
                  >
                    {selectedOrder.status}
                  </span>
                </div>
              </div>

              <div>
                <p className="text-[#c6aa79] text-xs tracking-[3px] mb-4">
                  ORDERED ITEMS
                </p>
                <div className="border border-white/10 rounded-xl overflow-hidden">
                  {selectedOrder.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex justify-between items-start gap-3 p-4 border-b border-white/5 last:border-0"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium break-words">
                          {item.item_name}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {item.quantity} ×{" "}
                          {currency(Number(item.price) || 0)}
                        </p>
                      </div>
                      <p className="text-sm text-[#c6aa79] whitespace-nowrap">
                        {currency(Number(item.price) * item.quantity)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-between items-center border-t border-[#c6aa79]/30 pt-5">
                <span className="text-gray-400">Total Amount</span>
                <span className="text-2xl font-serif text-[#c6aa79]">
                  {currency(Number(selectedOrder.total_amount) || 0)}
                </span>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => printInvoice(selectedOrder)}
                  className="flex-1 bg-[#c6aa79] text-[#171713] py-3 rounded-xl text-sm font-semibold hover:bg-[#ddc397]"
                >
                  Print Invoice
                </button>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="flex-1 border border-white/15 text-gray-300 py-3 rounded-xl text-sm hover:bg-white/5"
                >
                  Close Details
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}