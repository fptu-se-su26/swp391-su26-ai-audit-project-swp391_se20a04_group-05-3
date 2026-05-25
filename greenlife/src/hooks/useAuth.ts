import { useAppContext } from "../context/AppContext";

export const useAuth = () => {
  const { currentUser, userRole, switchRole, login, logout, loading } = useAppContext();

  return {
    user: currentUser,
    role: userRole,
    isAuthenticating: loading.auth,
    switchRole,
    login,
    logout,
    isAuthenticated: !!currentUser,
    isCustomer: userRole === "customer",
    isStoreOwner: userRole === "store",
    isAdmin: userRole === "admin"
  };
};
export default useAuth;
