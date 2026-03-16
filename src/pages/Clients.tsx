import { useAuth } from "@/contexts/AuthContext";
import { CrmTable } from "@/components/master/CrmTable";
import { PageLayout } from "@/components/PageLayout";

export default function Clients() {
  const { master } = useAuth();

  return (
    <PageLayout title="Клиенты" subtitle="CRM: история визитов и выручка">
      <div className="px-5">
        <CrmTable masterId={master?.id} />
      </div>
    </PageLayout>
  );
}
