import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import {
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  Check,
  Zap,
  Shield,
  TrendingUp,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "../context/AuthContext";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const features = [
  {
    icon: Zap,
    title: "AI-Powered Content",
    description: "Generate videos automatically with advanced AI",
  },
  {
    icon: Shield,
    title: "Secure & Reliable",
    description: "Enterprise-grade security for your channels",
  },
  {
    icon: TrendingUp,
    title: "Scale Faster",
    description: "Manage hundreds of channels from one dashboard",
  },
  {
    icon: Users,
    title: "Join 10,000+ Creators",
    description: "Trusted by content creators worldwide",
  },
];

export function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const navigate = useNavigate();
  const { checkAuth } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const endpoint = isLogin ? "/auth/login" : "/auth/signup";
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name, rememberMe, inviteCode }),
        // include credentials to receive HTTP-only cookies
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Authentication failed");
      }

      if (isLogin) {
        await checkAuth();
        navigate("/dashboard");
      } else {
        setSuccessMsg(
          data.message ||
            "Signup successful! Please check your email to verify.",
        );
        setEmail("");
        setPassword("");
        setName("");
        setInviteCode("");
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setEmail("");
    setPassword("");
    setName("");
    setInviteCode("");
    setErrorMsg("");
    setSuccessMsg("");
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex bg-gradient-to-r from-black via-zinc-900 to-zinc-800">
      {/* Left Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-12 relative z-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="w-full max-w-md"
        >
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 mb-8">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <rect
                  x="4"
                  y="4"
                  width="16"
                  height="16"
                  rx="3"
                  stroke="#18181b"
                  strokeWidth="2"
                  fill="none"
                />
                <line
                  x1="12"
                  y1="9"
                  x2="12"
                  y2="15"
                  stroke="#18181b"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <line
                  x1="9"
                  y1="12"
                  x2="15"
                  y2="12"
                  stroke="#18181b"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <span className="text-xl font-bold text-white">Post</span>
          </Link>

          <AnimatePresence mode="wait">
            <motion.div
              key={isLogin ? "login" : "signup"}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-white mb-2">
                  {isLogin ? "Welcome back" : "Create account"}
                </h1>
                <p className="text-zinc-400">
                  {isLogin
                    ? "Sign in to your account to continue scaling your YouTube empire"
                    : "Start your 14-day free trial and scale your content with AI"}
                </p>
                {errorMsg && (
                  <div className="mt-4 p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 text-sm">
                    {errorMsg}
                  </div>
                )}
                {successMsg && (
                  <div className="mt-4 p-3 bg-emerald-500/10 border border-emerald-500/50 rounded-lg text-emerald-400 text-sm">
                    {successMsg}
                  </div>
                )}
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {!isLogin && (
                  <motion.div
                    variants={itemVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    <Label htmlFor="name" className="text-zinc-300">
                      Full Name
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-zinc-400" />
                      <Input
                        id="name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="John Doe"
                        className="pl-10 bg-zinc-900 border-zinc-700 text-white placeholder-zinc-500"
                        required
                      />
                    </div>
                  </motion.div>
                )}

                <motion.div
                  variants={itemVariants}
                  initial="hidden"
                  animate="visible"
                >
                  <Label htmlFor="email" className="text-zinc-300">
                    Email
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-zinc-400" />
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="pl-10 bg-zinc-900 border-zinc-700 text-white placeholder-zinc-500"
                      required
                    />
                  </div>
                </motion.div>

                <motion.div
                  variants={itemVariants}
                  initial="hidden"
                  animate="visible"
                >
                  <Label htmlFor="password" className="text-zinc-300">
                    Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-zinc-400" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="pl-10 pr-10 bg-zinc-900 border-zinc-700 text-white placeholder-zinc-500"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-zinc-400 hover:text-white"
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </motion.div>

                {!isLogin && (
                  <motion.div
                    variants={itemVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    <Label htmlFor="inviteCode" className="text-zinc-300">
                      Invite Code
                    </Label>
                    <div className="relative">
                      <Input
                        id="inviteCode"
                        type="text"
                        value={inviteCode}
                        onChange={(e) => setInviteCode(e.target.value)}
                        placeholder="Your Invite Code"
                        className="bg-zinc-900 border-zinc-700 text-white placeholder-zinc-500"
                        required
                      />
                    </div>
                  </motion.div>
                )}

                {isLogin && (
                  <motion.div
                    variants={itemVariants}
                    initial="hidden"
                    animate="visible"
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="remember"
                        checked={rememberMe}
                        onCheckedChange={(checked: boolean) =>
                          setRememberMe(checked)
                        }
                      />
                      <Label
                        htmlFor="remember"
                        className="text-sm text-zinc-300"
                      >
                        Remember me
                      </Label>
                    </div>
                    <Link
                      to="/forgot-password"
                      className="text-sm text-zinc-400 hover:text-white"
                    >
                      Forgot password?
                    </Link>
                  </motion.div>
                )}

                <motion.div
                  variants={itemVariants}
                  initial="hidden"
                  animate="visible"
                >
                  <Button
                    type="submit"
                    className="w-full bg-white text-black hover:bg-zinc-200"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                        {isLogin ? "Signing in..." : "Creating account..."}
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-2">
                        {isLogin ? "Sign In" : "Create Account"}
                        <ArrowRight className="w-4 h-4" />
                      </div>
                    )}
                  </Button>
                </motion.div>
              </form>

              <motion.div
                variants={itemVariants}
                initial="hidden"
                animate="visible"
                className="mt-6 text-center"
              >
                <p className="text-zinc-400">
                  {isLogin
                    ? "Don't have an account?"
                    : "Already have an account?"}
                  <button
                    onClick={toggleMode}
                    className="ml-1 text-white hover:text-zinc-300 font-medium"
                  >
                    {isLogin ? "Sign up" : "Sign in"}
                  </button>
                </p>
              </motion.div>

              {!isLogin && (
                <motion.div
                  variants={itemVariants}
                  initial="hidden"
                  animate="visible"
                  className="mt-4 text-xs text-zinc-500 text-center"
                >
                  By creating an account, you agree to our{" "}
                  <Link to="/terms" className="hover:text-zinc-300">
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link to="/privacy" className="hover:text-zinc-300">
                    Privacy Policy
                  </Link>
                </motion.div>
              )}
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Right Side - Visual Content */}
      <div className="hidden lg:flex lg:w-1/2 items-center justify-center p-12 relative z-10">
        <motion.div
          className="max-w-lg w-full"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <h2 className="text-4xl font-bold text-white mb-6">
            Scale Your YouTube Empire with AI
          </h2>
          <p className="text-lg text-zinc-300 mb-12">
            Join thousands of creators who are automating their content
            production and growing their channels faster than ever before.
          </p>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-6"
          >
            {features.map((feature) => (
              <motion.div
                key={feature.title}
                variants={itemVariants}
                className="flex items-start gap-4"
              >
                <div className="w-12 h-12 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center flex-shrink-0">
                  <feature.icon className="w-6 h-6 text-zinc-300" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-1">
                    {feature.title}
                  </h3>
                  <p className="text-zinc-400 text-sm">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="mt-12 pt-8 border-t border-zinc-700"
          >
            <div>
              <div className="flex items-center gap-6">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="w-10 h-10 rounded-full bg-zinc-700 border-2 border-zinc-900 flex items-center justify-center"
                    >
                      <span className="text-xs font-medium text-zinc-300">
                        {i}
                      </span>
                    </div>
                  ))}
                </div>
                <div>
                  <div className="flex items-center gap-1 mb-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Check key={i} className="w-4 h-4 text-emerald-400" />
                    ))}
                  </div>
                  <p className="text-sm text-zinc-400">
                    <span className="font-medium text-white">
                      10,000+ creators
                    </span>{" "}
                    trust Post
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
