"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function TimeSlot() {
  const data = [
    ["9:00", "10:00", "11:00", "12:00"],
    ["13:00", "14:00", "15:00", "16:00", "17:00", "18:00"],
    ["19:00", "20:00", "21:00", "22:00"],
  ];

  return (
    <>
      <Card className="flex flex-col gap-5 p-6">
        <h4 className="text-xl">
          <span className="text-yellow-500">Siam Paragon</span> &rarr;{" "}
          <span className="text-rose-500">Assumption University</span>
        </h4>
        <div className="flex flex-col gap-8">
          {data.map((each, index) => {
            return (
              <div className="flex gap-3 flex-wrap" key={index}>
                {each.map((first) => {
                  return (
                    <Link
                      key={first}
                      href={{ pathname: "book", query: { time: first } }}
                    >
                      <Button>{first}</Button>
                    </Link>
                  );
                })}
              </div>
            );
          })}
        </div>
      </Card>
    </>
  );
}
