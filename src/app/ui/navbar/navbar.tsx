import logo from "@/app/navbar/logo.png";
import Image from "next/image";

export default function NavBar() {
  return (
    <>
      <div>
        <a>
          <Image
            src={`/navbar/logo.png`}
            alt={"AU Van logo"}
            width="120"
            height="120"
          />
        </a>
      </div>

      <div className="flex gap-10 underline underline-offset-8">
        <a href="#">Home</a>
        <a href="#">FAQ</a>
        <a href="#">Contact</a>
      </div>
    </>
  );
}
