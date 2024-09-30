import Link from "next/link";
import { useRouter } from "next/router";

export default function NavMenu() {
  const router = useRouter();

  return (
    <div className='hidden w-full lg:block lg:w-auto' id='navbar-default'>
      <ul className='uppercase flex flex-col p-4 mt-4 md:flex-row md:space-x-8 md:mt-0 md:text-base md:font-medium bg-transparent'>
        <li>
          <Link
            href='/'
            className={`block p-0 hover:text-white ${
              router.pathname.includes("product") || router.pathname === "/" ? "text-white" : "text-[#f8f8f880]"
            }`}
          >
            Products
          </Link>
        </li>
        <li>
          <Link
            href='/portfolio'
            className={`block p-0 hover:text-white ${router.pathname === "/portfolio" ? "text-white" : "text-[#f8f8f880]"}`}
          >
            Portfolio
          </Link>
        </li>
      </ul>
    </div>
  );
}
