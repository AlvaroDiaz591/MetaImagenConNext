import React from "react";
import type { AuthMode } from "@/src/shared/types/AuthMode";
import AuthFlipCard from "./AuthFlipCard";

type AuthExperienceProps = {
  initialMode: AuthMode;
};

const AuthExperience = ({ initialMode }: AuthExperienceProps) => {
  return <AuthFlipCard initialMode={initialMode} />;
};

export default AuthExperience;
