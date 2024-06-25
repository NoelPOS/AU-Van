"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function TimeSlot() {
  const data = [
    ["9", "10", "11", "12"],
    ["13", "14", "15", "16", "17", "18"],
    ["19", "20", "21", "22"],
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
                      <Button>{first}:00</Button>
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
