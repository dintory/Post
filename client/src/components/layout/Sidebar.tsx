import { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home,
  Users,
  FileText,
  BarChart3,
  Zap,
  Settings,
  ChevronDown,
  HelpCircle,
  LogOut,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const menuItems = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: Home,
  },
  {
    href: "/accounts",
    label: "Accounts",
    icon: Users,
    hasDropdown: true,
    children: [
      { href: "/accounts?filter=all", label: "All Accounts" },
      { href: "/accounts?filter=connected", label: "Connected" },
      { href: "/accounts?filter=pending", label: "Pending" },
    ],
  },
  {
    href: "/videos",
    label: "Videos",
    icon: FileText,
    badge: 8,
    badgeColor: "bg-[var(--accent-emerald)]/20 text-[var(--accent-emerald)]",
  },
  {
    href: "/analytics",
    label: "Analytics",
    icon: BarChart3,
    badge: 3,
    badgeColor: "bg-[var(--accent-amber)]/20 text-[var(--accent-amber)]",
  },
  {
    href: "/automation",
    label: "Automation",
    icon: Zap,
    badge: 4,
    badgeColor: "bg-[var(--accent-cyan)]/20 text-[var(--accent-cyan)]",
  },
  {
    href: "/settings",
    label: "Settings",
    icon: Settings,
    hasDropdown: true,
    isOpen: true,
    children: [
      { href: "/settings?section=general", label: "General" },
      { href: "/settings?section=notifications", label: "Notifications" },
      { href: "/settings?section=billing", label: "Billing" },
    ],
  },
];

const bottomItems = [{ href: "/help", label: "Help Center", icon: HelpCircle }];

export function Sidebar() {
  const location = useLocation();
  const { logout } = useAuth();
  const [openItems, setOpenItems] = useState<string[]>(["/settings"]);
  const [selectedChild, setSelectedChild] = useState<string | null>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);

  const toggleItem = (href: string) => {
    setOpenItems((prev) =>
      prev.includes(href) ? prev.filter((h) => h !== href) : [...prev, href],
    );
  };

  const selectChild = (parentHref: string, childLabel: string) => {
    setSelectedChild(`${parentHref}-${childLabel}`);
  };

  const isActive = (href: string) => location.pathname === href;

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target as Node)
      ) {
        // Keep Settings open by default, close others
        setOpenItems(["/settings"]);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <aside
      ref={sidebarRef}
      className="fixed left-0 top-0 h-full w-56 flex flex-col z-40"
      style={{ backgroundColor: "#0A0A0A", borderRight: "1px solid #1A1A1A" }}
    >
      {/* Logo */}
      <div className="p-4 px-4">
        <Link
          to="/dashboard"
          className="text-lg font-semibold tracking-tight text-[#E8E8E8]"
        >
          Post
        </Link>
      </div>

      {/* Main Menu */}
      <nav className="flex-1 px-2 py-2 space-y-0.5">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isOpen = openItems.includes(item.href);
          const active = isActive(item.href);

          return (
            <div key={item.href}>
              {item.hasDropdown ? (
                <button
                  type="button"
                  onClick={() => toggleItem(item.href)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                    active
                      ? "bg-[#141414] text-[#E8E8E8]"
                      : "text-[#909090] hover:bg-[#1A1A1A] hover:text-[#E8E8E8]"
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="flex-1 text-left">{item.label}</span>
                  <ChevronDown
                    className={`w-4 h-4 shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                  />
                </button>
              ) : (
                <Link
                  to={item.href}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                    active
                      ? "bg-[#141414] text-[#E8E8E8]"
                      : "text-[#909090] hover:bg-[#1A1A1A] hover:text-[#E8E8E8]"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="flex-1">{item.label}</span>
                  {item.badge && (
                    <span
                      className="px-1.5 py-0.5 text-[10px] font-medium rounded-full"
                      style={{
                        backgroundColor:
                          item.label === "Videos"
                            ? "rgba(16, 185, 129, 0.15)"
                            : item.label === "Analytics"
                              ? "rgba(245, 158, 11, 0.15)"
                              : item.label === "Automation"
                                ? "rgba(6, 182, 212, 0.15)"
                                : "rgba(232, 232, 232, 0.1)",
                        color:
                          item.label === "Videos"
                            ? "#10b981"
                            : item.label === "Analytics"
                              ? "#f59e0b"
                              : item.label === "Automation"
                                ? "#06b6d4"
                                : "#E8E8E8",
                      }}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              )}

              {/* Submenu with left border */}
              <AnimatePresence>
                {item.children && isOpen && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2, ease: "easeInOut" }}
                    className="relative ml-4 pl-4 mt-1 space-y-0.5 overflow-hidden"
                  >
                    {/* Left vertical line only */}
                    <div className="absolute left-0 top-0 bottom-0 w-px bg-[#1A1A1A]" />

                    {item.children.map((child) => {
                      const isChildSelected =
                        selectedChild === `${item.href}-${child.label}`;
                      return (
                        <Link
                          key={child.label}
                          to={child.href}
                          onClick={() => selectChild(item.href, child.label)}
                          className={`relative w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm text-left transition-all duration-150 ${
                            isChildSelected
                              ? "text-[#E8E8E8] bg-[#141414]"
                              : "text-[#505050] hover:text-[#909090]"
                          }`}
                        >
                          <span>{child.label}</span>
                        </Link>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </nav>

      {/* Bottom Items */}
      <div className="p-2 mt-auto border-t border-[#1A1A1A]">
        {bottomItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              to={item.href}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                active
                  ? "bg-[#141414] text-[#E8E8E8]"
                  : "text-[#909090] hover:bg-[#1A1A1A] hover:text-[#E8E8E8]"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="flex-1">{item.label}</span>
            </Link>
          );
        })}
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-[#505050] hover:bg-[#1A1A1A] hover:text-rose-400 transition-all duration-150"
        >
          <LogOut className="w-4 h-4" />
          <span>Log out</span>
        </button>
      </div>
    </aside>
  );
}
