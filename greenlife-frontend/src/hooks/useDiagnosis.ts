import { useAppContext } from "../context/AppContext";

export const useDiagnosis = () => {
  const { diagnosisLogs, diagnosePlant, deleteDiagnosisRecord, loading } = useAppContext();

  return {
    logs: diagnosisLogs,
    diagnose: diagnosePlant,
    deleteRecord: deleteDiagnosisRecord,
    isDiagnosing: loading.diagnosis
  };
};
export default useDiagnosis;
