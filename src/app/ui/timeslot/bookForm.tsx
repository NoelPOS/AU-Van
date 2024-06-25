"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useSearchParams } from "next/navigation";

export default function BookForm({ date }: { date: Date }) {
  const searchParams = useSearchParams();
  return (
    <Card className="w-[450px]">
      <CardHeader>
        <CardTitle>
          {new Intl.DateTimeFormat("en-US", { weekday: "long" }).format(date)},{" "}
          {date.getDate()} {date.toLocaleString("default", { month: "long" })}
          {" -> "}
          {searchParams.get("time")}:00
        </CardTitle>
        <CardDescription>
          If you entered wrong phone number the driver will be unable to pick
          you up
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form>
          <div className="grid w-full items-center gap-4">
            <div className="flex items-center gap-4">
              <Label className="w-16" htmlFor="name">
                Name
              </Label>
              <Input id="name" placeholder="Enter your name" />
            </div>
            <div className="flex items-center gap-4">
              <Label className="w-16" htmlFor="name">
                Place
              </Label>
              <Input id="name" placeholder="Enter your apartment name" />
            </div>
            <div className="flex items-center gap-4">
              <Label className="w-16" htmlFor="name">
                Phone
              </Label>
              <Input id="name" placeholder="+66912873212" />
            </div>
            <div className="flex items-center gap-4">
              <Label className="w-16" htmlFor="name">
                Person
              </Label>
              <Input id="name" placeholder="Enter number of person" />
            </div>
            <div className="flex items-center gap-4">
              <Label className="w-16" htmlFor="name">
                Payment
              </Label>
              <RadioGroup className="flex" defaultValue="cash">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="cash" id="cash" />
                  <Label htmlFor="cash">Cash</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="transfer" id="transfer" />
                  <Label htmlFor="transfer">Transfer</Label>
                </div>
              </RadioGroup>
            </div>
          </div>
        </form>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline">Cancel</Button>
        <Button>Book</Button>
      </CardFooter>
    </Card>
  );
}
