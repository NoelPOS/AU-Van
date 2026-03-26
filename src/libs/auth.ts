import { connectDB } from "@/libs/mongodb";
import User from "@/models/User";
import { verifyLineIdToken } from "@/lib/line-auth";
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }),
    CredentialsProvider({
      name: "LIFF",
      id: "liff",
      credentials: {
        idToken: { label: "LINE ID Token", type: "text" },
        displayName: { label: "Display Name", type: "text" },
        avatar: { label: "Avatar", type: "text" },
      },
      async authorize(credentials) {
        const idToken = credentials?.idToken;
        if (!idToken) throw new Error("Missing LIFF idToken");

        const verified = await verifyLineIdToken(String(idToken));
        await connectDB();

        const lineUserId = verified.sub;
        const verifiedEmail = verified.email?.toLowerCase();
        const fallbackEmail = `line_${lineUserId}@line.user`;
        const profileName =
          verified.name ||
          credentials?.displayName ||
          "LINE User";
        const profileImage =
          verified.picture ||
          credentials?.avatar ||
          "";

        const query = verifiedEmail
          ? { $or: [{ lineUserId }, { email: verifiedEmail }] }
          : { lineUserId };

        let user = await User.findOne(query).select("+password");

        if (!user) {
          user = await User.create({
            email: verifiedEmail || fallbackEmail,
            password: await bcrypt.hash(crypto.randomUUID(), 10),
            lineUserId,
            authProvider: "line",
            displayName: profileName,
            pictureUrl: profileImage,
            lineLinkedAt: new Date(),
            name: profileName,
            image: profileImage,
            isAdmin: false,
          });
        } else {
          let changed = false;
          if (!user.lineUserId) {
            user.lineUserId = lineUserId;
            changed = true;
          }
          if (user.authProvider !== "line" && !user.isAdmin) {
            user.authProvider = "line";
            changed = true;
          }
          if (!user.displayName && profileName) {
            user.displayName = profileName;
            changed = true;
          }
          if (!user.pictureUrl && profileImage) {
            user.pictureUrl = profileImage;
            changed = true;
          }
          if (!user.lineLinkedAt) {
            user.lineLinkedAt = new Date();
            changed = true;
          }
          if (!user.name && profileName) {
            user.name = profileName;
            changed = true;
          }
          if (!user.image && profileImage) {
            user.image = profileImage;
            changed = true;
          }
          if (changed) await user.save();
        }

        return {
          id: String(user._id),
          _id: String(user._id),
          name: user.name,
          email: user.email,
          phone: user.phone,
          isAdmin: user.isAdmin,
          image: user.image,
        };
      },
    }),
    CredentialsProvider({
      name: "Credentials",
      id: "credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        await connectDB();
        const user = await User.findOne({
          email: credentials?.email?.toLowerCase(),
        }).select("+password");

        if (!user) throw new Error("Invalid email or password");

        const passwordMatch = await bcrypt.compare(
          credentials!.password,
          user.password
        );
        if (!passwordMatch) throw new Error("Invalid email or password");

        return {
          id: String(user._id),
          _id: String(user._id),
          name: user.name,
          email: user.email,
          phone: user.phone,
          isAdmin: user.isAdmin,
        };
      },
    }),
  ],
  pages: {
    signIn: "/auth",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        await connectDB();
        const existingUser = await User.findOne({ email: user.email });
        if (!existingUser) {
          // Auto-create account for Google OAuth users
          const newUser = await User.create({
            email: user.email,
            name: user.name,
            image: user.image,
            password: await bcrypt.hash(crypto.randomUUID(), 10),
            authProvider: "google",
            displayName: user.name,
            pictureUrl: user.image,
            isAdmin: false,
          });
          (user as any)._id = String(newUser._id);
          (user as any).isAdmin = false;
          (user as any).phone = "";
        } else {
          if (existingUser.authProvider === "local") {
            existingUser.authProvider = "google";
            existingUser.displayName = existingUser.displayName || existingUser.name;
            existingUser.pictureUrl = existingUser.pictureUrl || existingUser.image;
            await existingUser.save();
          }
          (user as any)._id = String(existingUser._id);
          (user as any).isAdmin = existingUser.isAdmin;
          (user as any).phone = existingUser.phone;
        }
      }
      return true;
    },
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token._id = (user as any)._id || user.id;
        token.phone = (user as any).phone;
        token.isAdmin = (user as any).isAdmin || false;
      }
      if (trigger === "update" && session) {
        if (session.name) token.name = session.name;
        if (session.phone !== undefined) token.phone = session.phone;
      }
      return token;
    },
    async session({ session, token }) {
      return {
        ...session,
        user: {
          ...session.user,
          _id: token._id,
          name: token.name,
          phone: token.phone,
          isAdmin: token.isAdmin,
        },
      };
    },
  },
};
