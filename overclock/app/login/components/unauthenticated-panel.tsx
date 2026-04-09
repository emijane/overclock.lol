import { SignInForm } from "@/app/login/components/sign-in-form";
import { SignUpForm } from "@/app/login/components/sign-up-form";

export function UnauthenticatedPanel() {
  return (
    <div className="grid gap-6">
      <SignInForm />
      <SignUpForm />
    </div>
  );
}
