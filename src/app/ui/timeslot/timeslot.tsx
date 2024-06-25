"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { timeslot } from "@/app/lib/data";

export default function TimeSlot({ from, to }: { from: string; to: string }) {
  return (
    <>
      <Card className="flex flex-col gap-5 p-6">
        <h4 className="text-xl">
          <span className="text-yellow-500">{from}</span> &rarr;{" "}
          <span className="text-rose-500">{to}</span>
        </h4>
        <div className="flex flex-col gap-8">
          {timeslot.map((each, index) => {
            return (
              <div className="flex gap-3 flex-wrap" key={index}>
                {each.map((time) => {
                  return (
                    <Link
                      key={time}
                      href={{ pathname: "book", query: { time: time } }}
                    >
                      <Button>{time}</Button>
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
