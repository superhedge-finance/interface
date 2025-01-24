import NavMenu from "./NavMenu";
import WalletConnect from "./WalletConnect";
import Link from "next/link";
import NavMenuMobile from "./NavMenuMobile";
import React from "react";
import useToast from "../../hooks/useToast";

const Header = () => {
  const { toast, type } = useToast();
  return (
    <header className={"bg-blacknew-100 sticky z-50 top-0 rounded-br-[16px] rounded-bl-[16px]"}>
      <nav className='p-5 md:px-10'>
        <div className='container flex flex-wrap items-center justify-between mx-auto'>
          <Link href='/' className='flex grow lg:grow-0 items-center pt-1.5 w-[320px]'>
            <img src={"/icons/logo.svg"} alt={"logo"} />
          </Link>
          <NavMenu />
          <div className="w-[320px]">
          <WalletConnect isMobile={false}/>
          </div>
          
          <NavMenuMobile />
        </div>
      </nav>
      {toast && (
        <div
          className={`absolute top-[78px] left-0 w-full h-[64px] flex items-center justify-center uppercase text-whitenew-100 bg-${type} rounded-br-[16px] rounded-bl-[16px] z-50`}
        >
          {toast}
        </div>
      )}
    </header>
  );
};

export default Header;
