import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      _id: string;
      name: string;
      email?: string | null;
      phone?: string;
      defaultPickupLocation?: string;
      profileImageUrl?: string;
      image?: string;
      isAdmin: boolean;
    };
  }

  interface User {
    _id: string;
    name: string;
    email?: string | null;
    phone?: string;
    defaultPickupLocation?: string;
    profileImageUrl?: string;
    image?: string;
    isAdmin: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    _id: string;
    phone?: string;
    defaultPickupLocation?: string;
    profileImageUrl?: string;
    isAdmin: boolean;
  }
}
