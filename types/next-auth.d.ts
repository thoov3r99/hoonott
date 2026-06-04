import "next-auth";
import "next-auth/jwt";

type AppUserStatus = "pending" | "approved" | "rejected";
type AppUserRole = "user" | "admin";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string | null;
      image: string | null;
      status: AppUserStatus;
      role: AppUserRole;
      color: string | null;
    };
  }

  interface User {
    id?: string;
    email?: string | null;
    name?: string | null;
    image?: string | null;
    status?: AppUserStatus;
    role?: AppUserRole;
    color?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    status?: AppUserStatus;
    role?: AppUserRole;
    color?: string | null;
  }
}
