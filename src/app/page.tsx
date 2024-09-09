"use client";

import NavBar from "@/app/ui/navbar/navbar";
import DestinationSelection from "@/app/ui/destination-selection/destination-selection";
import Logo from "@/app/assets/img/Logo.png";
import Car from "@/app/assets/img/Car.png";

import Image from "next/image";

import { useSession } from "next-auth/react";
import Link from "next/link";

export default function Home() {
  const { status } = useSession();
  if (status === "authenticated") {
    return (
      <main className="flex flex-col gap-10">
        <div className="flex justify-between items-center">
          <NavBar />
        </div>

        <div className="flex flex-col justify-center items-center h-full gap-5">
          <section>
            <div className="mx-auto max-w-screen-xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8 lg:py-16">
              <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-16">
                <div className="relative h-64 overflow-hidden rounded-lg sm:h-80 lg:order-last lg:h-full">
                  <Image
                    alt=""
                    src={Car}
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                </div>

                <div className="lg:py-24">
                  <h2 className="text-3xl font-bold sm:text-4xl">
                    Pick a time slot
                  </h2>

                  <p className="mt-4 text-gray-600">
                    The AU Van service provides convenient transportation for
                    Assumption University students and staff, connecting the
                    campus with key destinations like Siam and Mega Bangna. With
                    regular schedules, the AU Van ensures a comfortable and
                    reliable commute to popular areas for shopping, dining, and
                    leisure. To reserve a seat, simply book in advance to
                    guarantee a smooth ride to your destination.
                  </p>

                  <Link
                    href="/routes"
                    className="mt-8 inline-block rounded bg-black px-12 py-3 text-sm font-medium text-white transition hover:bg-black focus:outline-none focus:ring focus:ring-yellow-400"
                  >
                    Get Started Today
                  </Link>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    );
  } else if (status === "loading") {
    return (
      <div className="flex flex-col justify-center items-center h-screen">
        <h1>Loading...</h1>
      </div>
    );
  } else {
    return (
      <div className="flex flex-col justify-center items-center h-screen ">
        <h1>Welcome aboard!</h1>
        <div className="hidden bg-muted lg:block">
          <Image
            src={Logo}
            alt="Image"
            className=" object-cover dark:brightness-[0.2] dark:grayscale rounded-lg"
          />
        </div>
        <Link
          href="/auth"
          className="text-[#888] text-sm text-999 mt-7 transition duration-150 ease hover:text-gray-800"
        >
          Login here
        </Link>
      </div>
    );
  }
}
