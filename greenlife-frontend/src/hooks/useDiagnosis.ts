import { useState } from "react";
import { useAppContext } from "../context/AppContext";

export const useDiagnosis = () => {
  const { diagnosisLogs, diagnosePlant, deleteDiagnosisRecord, loading } = useAppContext();
  const [userContext, setUserContext] = useState("");

  const diagnose = (file: File | Blob, contextOverride?: string) => {
    const textToSend = contextOverride !== undefined ? contextOverride : userContext;
    return diagnosePlant(file, textToSend);
  };

  return {
    logs: diagnosisLogs,
    userContext,
    setUserContext,
    diagnose,
    deleteRecord: deleteDiagnosisRecord,
    isDiagnosing: loading.diagnosis
  };
};
export default useDiagnosis;
