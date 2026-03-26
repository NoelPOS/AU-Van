import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      _id: string;
      name: string;
      email: string;
      phone?: string;
      image?: string;
      isAdmin: boolean;
    };
  }

  interface User {
    _id: string;
    name: string;
    email: string;
    phone?: string;
    image?: string;
    isAdmin: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    _id: string;
    phone?: string;
    isAdmin: boolean;
  }
}
