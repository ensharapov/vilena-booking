import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Mail, Phone, MessageCircle, Lock, Eye, EyeOff } from "lucide-react";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleEmailAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({ title: "Ошибка", description: "Заполните все поля", variant: "destructive" });
      return;
    }
    login(email);
    navigate("/role-select");
  };

  const handleSocialLogin = (provider: string) => {
    toast({
      title: "Скоро",
      description: `Вход через ${provider} будет доступен в ближайшее время`,
    });
  };

  return (
    <div className="app-container bg-background flex flex-col min-h-screen">
      <div className="flex-1 flex flex-col justify-center px-6 py-12">
        {/* Logo */}
        <div className="text-center mb-10">
          <h1 className="text-heading text-5xl font-bold text-foreground tracking-wide">Вилена</h1>
          <p className="text-muted-foreground mt-2 text-sm">Онлайн-запись к мастерам красоты</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-secondary rounded-xl p-1 mb-8">
          <button
            onClick={() => setIsLogin(true)}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
              isLogin ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"
            }`}
          >
            Вход
          </button>
          <button
            onClick={() => setIsLogin(false)}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
              !isLogin ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"
            }`}
          >
            Регистрация
          </button>
        </div>

        {/* Social buttons */}
        <div className="space-y-3 mb-6">
          <button
            onClick={() => handleSocialLogin("Телефон")}
            className="w-full flex items-center gap-3 card-premium px-4 py-3.5 text-sm font-medium text-foreground hover:bg-secondary/50 transition-colors active:scale-[0.98]"
          >
            <Phone className="w-5 h-5 text-primary" />
            Войти по номеру телефона
          </button>
          <button
            onClick={() => handleSocialLogin("ВКонтакте")}
            className="w-full flex items-center gap-3 card-premium px-4 py-3.5 text-sm font-medium text-foreground hover:bg-secondary/50 transition-colors active:scale-[0.98]"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="hsl(var(--primary))"><path d="M12.785 16.241s.288-.032.436-.194c.136-.148.132-.427.132-.427s-.02-1.304.587-1.496c.598-.189 1.366 1.26 2.18 1.817.616.42 1.084.328 1.084.328l2.175-.03s1.138-.07.598-.964c-.044-.073-.314-.66-1.618-1.864-1.366-1.262-1.183-1.058.462-3.242.999-1.328 1.398-2.139 1.273-2.485-.12-.332-.856-.244-.856-.244l-2.448.015s-.182-.025-.316.056c-.131.079-.216.263-.216.263s-.387 1.028-.903 1.903c-1.089 1.85-1.524 1.948-1.702 1.834-.415-.268-.311-1.074-.311-1.647 0-1.79.272-2.537-.53-2.73-.266-.063-.462-.105-1.143-.112-.873-.009-1.612.003-2.03.208-.278.136-.493.44-.362.457.162.022.528.099.722.363.25.34.242 1.107.242 1.107s.143 2.11-.335 2.372c-.329.18-.78-.188-1.748-1.87-.496-.86-.87-1.81-.87-1.81s-.072-.177-.2-.272c-.156-.115-.373-.152-.373-.152l-2.327.015s-.35.01-.478.162c-.114.134-.01.412-.01.412s1.816 4.246 3.873 6.388c1.886 1.964 4.028 1.835 4.028 1.835h.971z"/></svg>
            Войти через ВКонтакте
          </button>
          <button
            onClick={() => handleSocialLogin("Yandex ID")}
            className="w-full flex items-center gap-3 card-premium px-4 py-3.5 text-sm font-medium text-foreground hover:bg-secondary/50 transition-colors active:scale-[0.98]"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="hsl(var(--destructive))"><path d="M13.62 21.68h2.37V2.08h-3.66c-4.22 0-6.42 2.34-6.42 5.66 0 2.72 1.34 4.36 3.66 5.88l-4.08 8.06h2.6l4.38-8.56-1.14-.74c-1.88-1.22-2.84-2.44-2.84-4.74 0-2.32 1.56-3.82 3.86-3.82h1.26v17.86z"/></svg>
            Войти через Yandex ID
          </button>
          <button
            onClick={() => handleSocialLogin("Telegram")}
            className="w-full flex items-center gap-3 card-premium px-4 py-3.5 text-sm font-medium text-foreground hover:bg-secondary/50 transition-colors active:scale-[0.98]"
          >
            <MessageCircle className="w-5 h-5 text-telegram" />
            Войти через Telegram
          </button>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs text-muted-foreground">или по email</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* Email form */}
        <form onSubmit={handleEmailAuth} className="space-y-4">
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-10 h-12 rounded-xl bg-card border-border"
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="Пароль"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-10 pr-10 h-12 rounded-xl bg-card border-border"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <button type="submit" className="w-full btn-gradient h-12 text-sm">
            {isLogin ? "Войти" : "Зарегистрироваться"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Auth;
