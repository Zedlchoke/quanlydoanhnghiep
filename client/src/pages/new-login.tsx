import { useState } from "react";
import { UserTypeSelector } from "@/components/user-type-selector";
import { UnifiedLoginForm } from "@/components/unified-login-form";
import { useAuth } from "@/hooks/use-new-auth";
import type { UserLoginRequest } from "@shared/schema";

export function NewLoginPage() {
  const [selectedUserType, setSelectedUserType] = useState<"admin" | "employee" | null>(null);
  const { login } = useAuth();

  const handleLogin = async (credentials: UserLoginRequest): Promise<boolean> => {
    return await login(credentials);
  };

  const handleBack = () => {
    setSelectedUserType(null);
  };

  if (selectedUserType) {
    return (
      <UnifiedLoginForm
        userType={selectedUserType}
        onLogin={handleLogin}
        onBack={handleBack}
      />
    );
  }

  return (
    <UserTypeSelector
      onSelectUserType={setSelectedUserType}
    />
  );
}