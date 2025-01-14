import Link from "next/link";

export default function Footer() {
  return (
    <footer className='bg-blacknew-100 px-10 py-[20px] md:py-[35px] rounded-tl-[12px] rounded-tr-[12px]'>
      <div className='container mx-auto flex flex-col md:flex-row items-center justify-between h-full'>
        <Link href='/' className='flex items-center pt-1.5'>
          <img src={"/icons/logo.svg"} alt={"logo"} />
        </Link>
        <ul className='flex flex-col md:flex-row items-center text-base text-[#f8f8f880] dark:text-gray-400 space-y-6 md:space-y-0 my-10 md:my-0'>
          <li>
            <Link href='https://docs.superhedge.com/' target="_blank" className='text-[16px] leading-[16px] uppercase hover:underline mr-0 md:mr-8'>
              DOCS
            </Link>
          </li>
          <li>
            <Link href='https://docs.superhedge.com/other-resources/privacy-policy' target="_blank" className='text-[16px] leading-[16px] uppercase hover:underline mr-0 md:mr-8'>
              PRIVACY POLICY
            </Link>
          </li>
          <li>
            <Link href='https://docs.superhedge.com/other-resources/terms-of-use' target="_blank" className='text-[16px] leading-[16px] uppercase hover:underline mr-0 md:mr-8'>
              TERMS OF USE
            </Link>
          </li>
        </ul>
        <div className='flex mt-4 space-x-6 sm:justify-center sm:mt-0'>
          <Link href='https://discord.gg/9wdXqZqfbw' target="_blank" className='text-white border-[1px] border-white p-1.5 rounded-[6px]'>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M15.3232 3.30753C14.2668 2.80977 13.1521 2.45451 12.0069 2.2506C11.9965 2.24881 11.9858 2.25036 11.9763 2.25504C11.9669 2.25972 11.959 2.2673 11.9539 2.27674C11.8103 2.5381 11.6515 2.87995 11.5405 3.14758C10.306 2.95523 9.05035 2.95523 7.81587 3.14758C7.69206 2.84944 7.55201 2.5587 7.39636 2.27674C7.39114 2.2674 7.38328 2.25991 7.37383 2.25525C7.36438 2.25058 7.35378 2.24896 7.34341 2.2506C6.19792 2.45342 5.08297 2.80886 4.02708 3.30753C4.01804 3.31107 4.01048 3.31772 4.00569 3.32635C1.89391 6.56611 1.31454 9.72643 1.59862 12.847C1.59964 12.8617 1.60881 12.8763 1.62001 12.8857C2.84973 13.821 4.22521 14.535 5.68779 14.9975C5.69812 15.0008 5.70921 15.0007 5.71947 14.9971C5.72972 14.9935 5.7386 14.9867 5.74481 14.9776C6.05842 14.5385 6.33741 14.0754 6.57771 13.5882C6.58272 13.5782 6.58444 13.5668 6.5826 13.5556C6.58077 13.5445 6.57548 13.5343 6.56753 13.5265C6.56227 13.5214 6.55603 13.5175 6.5492 13.515C6.11051 13.3419 5.68565 13.134 5.27847 12.893C5.26709 12.8864 5.25863 12.8755 5.25484 12.8627C5.25105 12.8499 5.25222 12.836 5.2581 12.824C5.26157 12.8162 5.2668 12.8094 5.27337 12.8042C5.35891 12.7383 5.44444 12.6693 5.52589 12.6003C5.53309 12.5944 5.54172 12.5905 5.55087 12.5893C5.56002 12.588 5.56933 12.5893 5.57782 12.593C8.24454 13.8433 11.1312 13.8433 13.7653 12.593C13.7741 12.5891 13.7838 12.5877 13.7933 12.589C13.8028 12.5903 13.8118 12.5942 13.8193 12.6003C13.9007 12.6693 13.9863 12.7383 14.0718 12.8042C14.0787 12.8094 14.0843 12.8162 14.088 12.8242C14.0917 12.8321 14.0934 12.8409 14.093 12.8497C14.0926 12.8585 14.0901 12.8671 14.0857 12.8746C14.0813 12.8822 14.0751 12.8885 14.0677 12.893C13.6615 13.1362 13.2361 13.3439 12.796 13.514C12.789 13.5166 12.7826 13.5208 12.7773 13.5262C12.772 13.5316 12.768 13.5382 12.7654 13.5454C12.7631 13.5523 12.7621 13.5597 12.7627 13.5671C12.7632 13.5745 12.7652 13.5817 12.7685 13.5882C13.0129 14.0743 13.2929 14.5385 13.6004 14.9776C13.6066 14.9867 13.6155 14.9935 13.6257 14.9971C13.636 15.0007 13.6471 15.0008 13.6574 14.9975C15.1224 14.5365 16.5001 13.8223 17.7313 12.8857C17.7374 12.8813 17.7426 12.8756 17.7463 12.8689C17.75 12.8622 17.7522 12.8547 17.7527 12.847C18.0927 9.23926 17.1835 6.10508 15.3436 3.32739C15.3417 3.3228 15.3389 3.31866 15.3354 3.31524C15.3319 3.31182 15.3277 3.30919 15.3232 3.30753V3.30753ZM6.97584 10.9464C6.17246 10.9464 5.51164 10.1896 5.51164 9.26122C5.51164 8.33183 6.16024 7.57495 6.97584 7.57495C7.79754 7.57495 8.45225 8.33811 8.44003 9.26122C8.44003 10.1896 7.79143 10.9464 6.97584 10.9464ZM12.3887 10.9464C11.5863 10.9464 10.9245 10.1896 10.9245 9.26122C10.9245 8.33183 11.5731 7.57495 12.3887 7.57495C13.2104 7.57495 13.8661 8.33811 13.8529 9.26122C13.8529 10.1896 13.2104 10.9464 12.3887 10.9464Z" fill="#F8F6F5"/>
            </svg>
            <span className='sr-only'>Discord</span>
          </Link>
          <Link href='https://t.me/superhedgeio' target="_blank" className='text-white border-[1px] border-white p-1.5 rounded-[6px]'>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M15.8583 3.46791L13.5413 14.6757C13.3664 15.4666 12.9107 15.6635 12.2631 15.2911L8.73254 12.6226L7.02925 14.3033C6.8406 14.4968 6.68322 14.6583 6.31964 14.6583L6.57354 10.9705L13.1163 4.90622C13.401 4.64635 13.0544 4.50179 12.6743 4.76222L4.58564 9.98672L1.10338 8.86847C0.346055 8.62604 0.332345 8.09166 1.26131 7.71872L14.8816 2.33616C15.5123 2.09372 16.0639 2.48016 15.8583 3.46847V3.46791Z" fill="#F8F6F5"/>
            </svg>
            <span className='sr-only'>Telegram</span>
          </Link>
          <Link href='https://superhedge.medium.com/' target="_blank" className='text-white border-[1px] border-white p-1.5 rounded-[6px]'>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3.09618 5.44654C3.10486 5.35523 3.09324 5.26305 3.06224 5.17736C3.03125 5.09166 2.98174 5.01484 2.91768 4.95304L1.59452 3.25279V2.99854H5.70143L8.87618 10.4273L11.667 2.99854H15.5827V3.25279L14.4515 4.40854C14.4035 4.44772 14.3666 4.49996 14.3445 4.55966C14.3224 4.61937 14.316 4.6843 14.3261 4.74753V13.248C14.316 13.3113 14.3224 13.3762 14.3445 13.4359C14.3666 13.4956 14.4035 13.5478 14.4515 13.587L15.5565 14.7435V14.9985H10.0003V14.7443L11.145 13.5593C11.2576 13.4393 11.2576 13.404 11.2576 13.221V6.34954L8.07577 14.97H7.64652L3.94193 6.34954V12.1275C3.91147 12.3698 3.98727 12.615 4.14735 12.7905L5.63556 14.7165V14.97H1.41602V14.7165L2.90352 12.7905C2.98222 12.7036 3.04063 12.5983 3.07408 12.4832C3.10754 12.3681 3.1151 12.2463 3.09618 12.1275V5.44654Z" fill="#F8F6F5"/>
            </svg>
            <span className='sr-only'>Medium</span>
          </Link>
          <Link href='https://twitter.com/superhedgeio' target="_blank" className='text-white border-[1px] border-white p-1.5 rounded-[6px]'>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M2 2L16 16M16 2L2 16" stroke="#F8F6F5" strokeWidth="2"/>
            </svg>
            <span className='sr-only'>Twitter</span>
          </Link>
        </div>
      </div>
    </footer>
  );
}
