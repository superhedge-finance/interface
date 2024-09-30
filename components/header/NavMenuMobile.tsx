import { useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import WalletConnect from "./WalletConnect";

export default function NavMenuMobile() {
    const router = useRouter();
    const [isClicked, setIsClicked] = useState(false);
    return (
        <>
            <img
                className="block lg:hidden cursor-pointer ml-6"
                src={!isClicked ? "/layouts/nav_menu.svg" : "/layouts/nav_menu_close.svg"}
                alt={"nav menu"}
                onClick={() => setIsClicked(!isClicked)}
            />
            { isClicked && (
                <div className='w-full lg:hidden flex items-center'>
                    <ul className="uppercase flex flex-col flex-grow p-4 mt-4 font-light text-xl bg-transparent">
                        <li className="border-b-[1px] border-white border-opacity-30 py-5">
                            <Link href='/' className={`block p-0 hover:text-white ${(router.pathname.includes('product') || router.pathname === '/') ? 'text-white' : 'text-[#f8f8f880]'}`}>
                                Products
                            </Link>
                        </li>
                        <li className="border-b-[1px] border-white border-opacity-30 py-5">
                            <Link href="/portfolio" className={`block p-0 hover:text-white ${router.pathname === '/portfolio' ? 'text-white' : 'text-[#f8f8f880]'}`}>
                                Portfolio
                            </Link>
                        </li>
                        <li className="md:hidden pt-10">
                            <WalletConnect isMobile={true} />
                        </li>
                    </ul>
                </div>
            )}
        </>
    );
}
