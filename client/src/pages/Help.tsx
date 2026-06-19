import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  MessageCircle,
  Video,
  FileText,
  ChevronRight,
  Mail,
  ExternalLink,
  Sparkles,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const faqs = [
  {
    question: "How do I connect my YouTube channels?",
    answer:
      'Go to the Accounts page and click "Add Account" to authorize your YouTube channels via OAuth. You can also import multiple accounts via CSV.',
  },
  {
    question: "What video templates are available?",
    answer: "We currently only offer reddit stories.",
  },
  {
    question: "How does the AI video generation work?",
    answer:
      "Our AI analyzes your script, selects appropriate visuals, generates voiceovers, and assembles everything into a professional video with auto-captions.",
  },
  {
    question: "Can I schedule videos to publish later?",
    answer:
      "Yes! When creating a video, you can set a publish date and time. Videos will be automatically uploaded to your selected channels at the scheduled time.",
  },
  {
    question: "What analytics are tracked?",
    answer:
      "We track views, subscribers, watch time, engagement rates, revenue, and audience demographics across all your connected channels.",
  },
  {
    question: "Is there a free trial?",
    answer:
      "No! Users do not get a free trial. They must purchase a plan to use the AI video generation features.",
  },
];

const supportOptions = [
  {
    icon: Mail,
    title: "Email Support",
    description: "Get help via email within 24h",
    action: "67@gmail.com",
    link: "https://www.roblox.com/users/1431529325/profile",
    gradient: "from-blue-500/20 to-purple-500/20",
    iconColor: "text-blue-400",
  },
  {
    icon: MessageCircle,
    title: "Live Chat",
    description: "Chat with our team directly",
    action: "Start Chat",
    link: "https://nohello.net/en/",
    gradient: "from-emerald-500/20 to-teal-500/20",
    iconColor: "text-emerald-400",
  },
  {
    icon: Video,
    title: "Video Tutorials",
    description: "Step-by-step video guides",
    action: "Watch Now",
    link: "https://www.youtube.com/watch?v=aSe-Cfqb1aY", // LOLLOLO
    gradient: "from-orange-500/20 to-red-500/20",
    iconColor: "text-orange-400",
  },
  {
    icon: FileText,
    title: "Documentation",
    description: "Comprehensive API & usage docs",
    action: "View Docs",
    link: "https://www.youtube.com/watch?v=aSe-Cfqb1aY", // LOLLOLO
    gradient: "from-pink-500/20 to-rose-500/20",
    iconColor: "text-pink-400",
  },
];

export function Help() {
  const [searchQuery, setSearchQuery] = useState("");
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const filteredFaqs = faqs.filter(
    (faq) =>
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="pt-8 pb-12 w-full min-h-screen">
      {/* Background Effects */}
      <div className="fixed top-0 left-0 w-full h-[500px] bg-gradient-to-b from-blue-500/10 via-zinc-950/50 to-transparent pointer-events-none" />
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-blue-500/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16 pt-8"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4" />
            <span>Support Center</span>
          </div>
          <h1 className="text-5xl font-bold text-white mb-6 tracking-tight">
            How can we help you{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
              succeed?
            </span>
          </h1>
          <p className="text-xl text-zinc-400 max-w-2xl mx-auto">
            Search our knowledge base or browse categories to find answers to
            your questions.
          </p>
        </motion.div>

        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="relative max-w-2xl mx-auto mb-20 group"
        >
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/30 to-emerald-500/30 rounded-2xl blur-lg opacity-50 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="relative bg-zinc-900/80 backdrop-blur-xl border border-zinc-700/50 rounded-2xl p-1.5 flex items-center shadow-2xl">
            <div className="pl-4 pr-2">
              <Search className="w-5 h-5 text-zinc-400" />
            </div>
            <Input
              placeholder="Search for articles, guides, or features..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="border-0 bg-transparent text-base py-3 focus-visible:ring-0 focus-visible:ring-offset-0 text-white placeholder-zinc-500 w-full"
            />
            <Button className="bg-white text-black hover:bg-zinc-200 rounded-xl px-6 py-4 text-sm font-semibold transition-transform hover:scale-105 ml-2">
              Search
            </Button>
          </div>
        </motion.div>

        {/* Support Options Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
          {supportOptions.map((option, index) => {
            const CardContent_ = (
              <>
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${option.gradient} rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl`}
                />
                <div className="relative h-full bg-zinc-900/50 backdrop-blur-sm border border-zinc-800/50 hover:border-zinc-700/50 rounded-2xl p-6 flex flex-col items-center text-center transition-all duration-300 cursor-pointer">
                  <div className="w-14 h-14 bg-zinc-800/80 rounded-2xl flex items-center justify-center mb-6 shadow-inner group-hover:scale-110 transition-transform duration-300">
                    <option.icon className={`w-7 h-7 ${option.iconColor}`} />
                  </div>
                  <h3 className="font-semibold text-white mb-2 text-lg">
                    {option.title}
                  </h3>
                  <p className="text-sm text-zinc-400 mb-6 flex-grow">
                    {option.description}
                  </p>
                  <span
                    className={`flex items-center gap-2 text-sm font-medium ${option.iconColor} hover:opacity-80 transition-opacity mt-auto`}
                  >
                    {option.action} <ExternalLink className="w-4 h-4" />
                  </span>
                </div>
              </>
            );

            return (
              <motion.div
                key={option.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + index * 0.1 }}
                whileHover={{ y: -5 }}
                className="group relative h-full"
              >
                {option.link ? (
                  <a
                    href={option.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block h-full"
                  >
                    {CardContent_}
                  </a>
                ) : (
                  <button
                    onClick={() =>
                      alert(
                        "Live chat is not available yet. Please email us instead.",
                      )
                    }
                    className="block h-full w-full text-left"
                  >
                    {CardContent_}
                  </button>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* FAQ Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="max-w-3xl mx-auto"
        >
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-white mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-zinc-400">
              Can't find what you're looking for? Check out our most common
              questions below.
            </p>
          </div>

          <div className="space-y-4">
            <AnimatePresence>
              {filteredFaqs.map((faq, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-zinc-900/30 border border-zinc-800/50 rounded-2xl overflow-hidden backdrop-blur-sm hover:border-zinc-700/50 transition-colors duration-300"
                >
                  <button
                    onClick={() => setOpenFaq(openFaq === index ? null : index)}
                    className="w-full flex items-center justify-between p-6 text-left"
                  >
                    <span className="font-semibold text-white text-lg pr-8">
                      {faq.question}
                    </span>
                    <div
                      className={`flex-shrink-0 w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center transition-transform duration-300 ${openFaq === index ? "rotate-90 bg-zinc-700" : ""}`}
                    >
                      <ChevronRight className="w-5 h-5 text-zinc-400" />
                    </div>
                  </button>
                  <AnimatePresence>
                    {openFaq === index && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                      >
                        <div className="px-6 pb-6 pt-2">
                          <div className="w-full h-px bg-gradient-to-r from-transparent via-zinc-800 to-transparent mb-6" />
                          <p className="text-zinc-400 leading-relaxed text-lg">
                            {faq.answer}
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {filteredFaqs.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16 bg-zinc-900/20 rounded-2xl border border-zinc-800/50 border-dashed"
            >
              <Search className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-white mb-2">
                No results found
              </h3>
              <p className="text-zinc-400">Try adjusting your search query.</p>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
