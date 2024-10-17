import Link from "next/link";
import Image from "next/image";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Menu } from "@headlessui/react";
import { disconnect } from "@wagmi/core";

export default function WalletConnect({ isMobile }: { isMobile: boolean}) {
  const onDisconnect = async () => {
    await disconnect();
  };

  return (
    <div className={`${isMobile ? "block": "hidden"} md:flex`}>
      <ConnectButton.Custom>
        {({ account, chain, openChainModal, openConnectModal, mounted }) => {
          return (
            <div
              {...(!mounted && {
                "aria-hidden": true,
                style: {
                  opacity: 0,
                  pointerEvents: "none",
                  userSelect: "none"
                }
              })}
            >
              {(() => {
                if (!mounted || !account || !chain) {
                  return (
                    <div
                      className='uppercase text-[#161717] text-[16px] md:text-[14px] text-center font-semibold bg-white py-[15px] cursor-pointer px-8 rounded-[8px]'
                      onClick={openConnectModal}
                    >
                      Connect Wallet
                    </div>
                  );
                }

                if (chain.unsupported) {
                  console.log("Unsupported chain");
                  return (
                    <div onClick={openChainModal} className={"text-yellow-500 text-center"}>
                      Wrong network
                    </div>
                  );
                }

                return (
                  <Menu as={"div"} className={"relative flex items-center justify-center md:justify-start"}>
                    <button
                      onClick={openChainModal}
                      className={"sm:flex items-center text-white hidden mr-4"}
                      type='button'
                    >
                      {chain.hasIcon && (
                        <div
                          style={{
                            background: chain.iconBackground,
                            width: 16,
                            height: 16,
                            borderRadius: 999,
                            overflow: "hidden",
                            marginRight: 6
                          }}
                        >
                          {chain.iconUrl && <Image alt={chain.name ?? "Chain icon"} src={chain.iconUrl} width={16} height={16} />}
                        </div>
                      )}
                      {chain.name}
                    </button>
                    <Menu.Button as={"div"} className={"flex-1 text-center"}>
                      <div
                        className={
                          "text-[#F8F6F5] uppercase text-lg md:text-[16px] font-medium bg-[#161717] border-[1px] border-[#CFD1D3] rounded-[8px] cursor-pointer py-[10px] px-6"
                        }
                      >
                        {account.displayName}
                        {account.displayBalance ? ` (${account.displayBalance})` : ""}
                      </div>
                      <Menu.Items
                        as={"div"}
                        className={"absolute bg-[#161717] rounded-bl-lg rounded-br-lg text-xl md:text-[16px] leading-[16px] z-[99] w-full left-0 md:w-2/3 md:left-auto"}
                      >
                        <Menu.Item 
                          as={"div"} 
                          className={"border-[1px] border-[#4B4B4B]"}
                        >
                          <Link href={"/profile"}>
                            <div className={"flex items-center justify-center h-full text-grey-70 py-6 px-[10px]"}>PROFILE</div>
                          </Link>
                        </Menu.Item>
                        <Menu.Item
                          as={"div"}
                          className={"flex items-center justify-center cursor-pointer text-grey-70 py-6 px-[10px]"}
                          onClick={onDisconnect}
                        >
                          DISCONNECT WALLET
                        </Menu.Item>
                      </Menu.Items>
                    </Menu.Button>
                  </Menu>
                );
              })()}
            </div>
          );
        }}
      </ConnectButton.Custom>
    </div>
  );
}
