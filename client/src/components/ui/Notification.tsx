import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface NotificationProps {
  id: string;
  message: string;
  linkTo?: string;
  icon?: React.ElementType;
}

export function Notification({
  id,
  message,
  linkTo,
  icon: Icon = ArrowRight,
}: NotificationProps) {
  const [isVisible, setIsVisible] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if dismissed forever
    const isDismissed = localStorage.getItem(`notification_dismissed_${id}`);
    if (!isDismissed) {
      setIsVisible(true);
    }
  }, [id]);

  const handleDismissSession = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsVisible(false);
  };

  const handleDismissForever = (e: React.MouseEvent) => {
    e.stopPropagation();
    localStorage.setItem(`notification_dismissed_${id}`, "true");
    setIsVisible(false);
  };

  const handleClick = () => {
    if (linkTo) {
      navigate(linkTo);
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, height: 0, padding: 0 }}
          className="px-5 py-3 cursor-pointer group"
          onClick={handleClick}
        >
          <div className="rounded-lg px-4 py-3 flex items-center justify-between bg-[#171717] border border-[#262626] hover:border-[#333] transition-colors shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#262626] flex items-center justify-center group-hover:bg-[#333] transition-colors">
                <Icon className="w-4 h-4 text-[#fafafa]" />
              </div>
              <span className="text-[#fafafa] text-sm font-medium">
                {message}
              </span>
            </div>
            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={handleDismissSession}
                className="text-xs text-[#a3a3a3] hover:text-[#fafafa] px-2 py-1 rounded bg-[#262626] hover:bg-[#333] transition-colors"
                title="Hide for now"
              >
                Hide
              </button>
              <button
                onClick={handleDismissForever}
                className="text-xs text-[#a3a3a3] hover:text-[#fafafa] px-2 py-1 rounded bg-[#262626] hover:bg-[#333] transition-colors"
                title="Never show again"
              >
                Don't show again
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
