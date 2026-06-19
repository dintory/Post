import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Sparkles, Wand2, Video } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Dashboard() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 bg-transparent">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-md w-full text-center"
      >
        <div className="mb-8">
          <div className="w-20 h-20 rounded-full bg-indigo-500/10 flex items-center justify-center mx-auto mb-6">
            <Sparkles className="w-10 h-10 text-indigo-400" />
          </div>
          <h1 className="text-2xl font-semibold text-[#E8E8E8] tracking-tight mb-3">
            Dashboard Coming Soon
          </h1>
          <p className="text-[#909090] text-sm leading-relaxed mb-2 max-w-[36ch] mx-auto">
            We are polishing the metrics and analytics command deck. In the
            meantime, you can manage your video channels directly.
          </p>
        </div>

        <div className="flex items-center justify-center gap-3">
          <Link to="/video">
            <Button className="flex items-center gap-2">
              <Wand2 className="w-4 h-4" />
              Create a Short
            </Button>
          </Link>
          <Link to="/videos">
            <Button variant="secondary" className="flex items-center gap-2">
              <Video className="w-4 h-4" />
              View Videos
            </Button>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
