import logo from "@/app/navbar/logo.png";
import Image from "next/image";
import Link from "next/link";

export default function NavBar() {
  return (
    <>
      <div>
        <Link href="/">
          <Image
            src={`/navbar/logo.png`}
            alt={"AU Van logo"}
            width="120"
            height="120"
          />
        </Link>
      </div>

      <div className="flex gap-10 underline underline-offset-8">
        <Link href="#">Home</Link>
        <Link href="#">FAQ</Link>
        <Link href="#">Contact</Link>
      </div>
    </>
  );
}
