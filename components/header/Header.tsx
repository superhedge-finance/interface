import Image from 'next/image';
import NavMenu from './NavMenu';
import WalletConnect from './WalletConnect';
const Header = () => {
    return (
        <>
            <nav className="bg-white border-gray-200 px-2 sm:px-4 py-2.5 rounded dark:bg-gray-900">
                <div className="container flex flex-wrap items-center justify-between mx-auto">
                    <a href="https://superhedge.com/" className="flex items-center" target="_blank">
                        <Image src="/next.svg" className="h-6 mr-3 sm:h-9" alt="Superhedge Logo" width={100} height={100} />
                        <span className="self-center text-xl font-semibold whitespace-nowrap dark:text-white">Superhedge</span>
                    </a>
                    <NavMenu />
                    <WalletConnect />
                </div>
            </nav>
        </>
    )
};

export default Header;