import { redirect } from "next/navigation";
import { LoginForm } from "@/components/login-form";
import { auth } from "@/lib/auth";

export default async function SignInPage() {
  // Redirect jika sudah login
  const session = await auth();

  if (session) {
    if (session.user.role === "ADMIN") {
      redirect("/administrator");
    } else {
      redirect("/");
    }
  }

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <LoginForm />
      </div>
    </div>
  );
}
