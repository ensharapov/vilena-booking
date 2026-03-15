import { useAuth } from "@/contexts/AuthContext";
import { CrmTable } from "@/components/master/CrmTable";

export default function Clients() {
  const { master } = useAuth();

  return (
    <div className="app-container bg-background min-h-screen">
      <div className="px-5 pt-6 pb-4">
        <h1 className="text-heading text-2xl font-bold text-foreground">Клиенты</h1>
        <p className="text-muted-foreground text-xs mt-1">CRM: история визитов и выручка</p>
      </div>

      <div className="px-5">
        <CrmTable masterId={master?.id} />
      </div>
    </div>
  );
}
