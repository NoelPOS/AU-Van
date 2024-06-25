"use client";
import { useState, useEffect } from "react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import TimeSlot from "@/app/ui/timeslot/timeslot";

export default function DestinationSelection() {
  const data = {
    assumption_university: ["Siam Paragon", "Mega Bangna"],
    siam_paragon: ["Assumption University"],
    mega_bangna: ["Assumption University"],
  };
  const [from, setFrom] = useState<string>("");
  const [to, setTo] = useState<string>("");
  const [selectedFROM, setSelectedFROM] = useState<boolean>(false);

  function FROMhandleValueChange(value: string): void {
    setFrom(value);
    setSelectedFROM(true);
    setTo("");
  }

  function TOhandleValueChange(value: string): void {
    setTo(value);
  }

  function toTitleCase(str: string) {
    return str
      .split("_")
      .join(" ")
      .replace(
        /\w\S*/g,
        (text) =>
          text.charAt(0).toUpperCase() + text.substring(1).toLowerCase(),
      );
  }

  return (
    <>
      <div className="flex justify-center items-center gap-5">
        <Select value={from} onValueChange={FROMhandleValueChange}>
          <SelectTrigger className="lg:w-[200px] w-[150px]">
            <SelectValue placeholder="From" />
          </SelectTrigger>
          <SelectContent>
            {Object.keys(data).map((each) => {
              return (
                <SelectItem key={each} value={toTitleCase(each)}>
                  {toTitleCase(each)}
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
        -
        <Select
          disabled={!selectedFROM}
          value={to}
          onValueChange={TOhandleValueChange}
        >
          <SelectTrigger className="lg:w-[200px] w-[150px]">
            <SelectValue placeholder="To" />
          </SelectTrigger>
          <SelectContent>
            {data[
              from.toLowerCase().split(" ").join("_") as keyof typeof data
            ]?.map((each: string) => {
              return (
                <SelectItem key={each} value={each}>
                  {each}
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>

      <div className="flex">
        <TimeSlot from={from} to={to} />
      </div>
    </>
  );
}
