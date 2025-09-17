import { useEffect, useRef, useState } from "react";
import { seedDocumentsForContractor } from "@/services/contractors";
import { sendInvitation } from "@/services/email";
import { exportContractorBundle } from "@/utils/export";

export default function QARunner(){
  const [logs, setLogs] = useState<string[]>([]);
  const ran = useRef(false);
  useEffect(() => {
    if (ran.current) return; ran.current = true;
    (async () => {
      const contractorId = "qa-"+Math.random().toString(36).slice(2,8);
      const contractorName = "QA GmbH";
      const pkg = "Standard";
      setLogs(l => [...l, `Start QA for ${contractorId}`]);
      await seedDocumentsForContractor(contractorId, pkg);
      setLogs(l => [...l, `[mock] seeded docs for ${contractorId} (${pkg})`]);
      await sendInvitation({ 
        contractorId, 
        email: "qa@example.com", 
        message: "QA test invitation" 
      });
      setLogs(l => [...l, `[stub] sendInvitation { contractorId: ${contractorId}, email: qa@example.com }`]);
      await exportContractorBundle({ contractorName, documents: [] });
      setLogs(l => [...l, `Export triggered: ZIP with deckblatt.pdf for ${contractorName}`]);
    })();
  }, []);
  return (
    <div className="p-6 space-y-3">
      <h1 className="text-xl font-semibold">QA Runner</h1>
      <p>Führt Wizard-Seeding, Einladung (Stub) und Export (ZIP) automatisch aus.</p>
      <pre className="bg-muted p-4 rounded-md text-sm whitespace-pre-wrap">{logs.join("\n")}</pre>
    </div>
  );
}