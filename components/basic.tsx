import React from "react";

export const PrimaryButton = ({
  label,
  disabled = false,
  loading = false,
  className,
  onClick
}: {
  label: string;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  onClick?: () => void;
}) => {
  return (
    <button
      className={`bg-[#292929] w-full text-white rounded-[8px] px-[28px] h-[50px] ${className ?? ""} ${
        disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"
      } ${loading ? "flex items-center justify-center gap-2" : ""}`}
      onClick={!disabled ? onClick : undefined}
    >
      {loading && (
        <svg className='animate-spin -ml-1 mr-3 h-5 w-5 text-white' xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24'>
          <circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4'></circle>
          <path
            className='opacity-75'
            fill='currentColor'
            d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
          ></path>
        </svg>
      )}
      {label}
    </button>
  );
};

export const SecondaryButton = ({
  label,
  disabled = false,
  className,
  onClick
}: {
  label: string;
  disabled?: boolean;
  className?: string;
  onClick?: () => void;
}) => {
  return (
    <button
      className={`bg-white border-[1px] border-[#292929] w-full text-black rounded-[8px] h-[50px] px-[28px] ${className ?? ""} ${
        disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"
      }`}
      onClick={!disabled ? onClick : undefined}
    >
      {label}
    </button>
  );
};

export const TitleH2 = ({ children, className = "text-[#161717]" }: { children: React.ReactNode; className?: string }) => {
  return <span className={`text-[36px] md:text-[44px] leading-[44px] ${className ?? ""}`}>{children}</span>;
};

export const TitleH3 = ({ children, className }: { children: React.ReactNode; className?: string }) => {
  return <span className={`text-[32px] text-[#161717] leading-[40px] ${className ?? ""}`}>{children}</span>;
};

export const TitleH5 = ({ children, className }: { children: React.ReactNode; className?: string }) => {
  return <span className={`text-[24px] leading-[32px] text-[#161717] ${className ?? ""}`}>{children}</span>;
};

export const ParaLight16 = ({ children, className }: { children: React.ReactNode; className?: string }) => {
  return <span className={`text-[16px] leading-[24px] text-grey-70 font-light ${className ?? ""}`}>{children}</span>;
};

export const ParaRegular18 = ({ children, className }: { children: React.ReactNode; className?: string }) => {
  return <span className={`text-[18px] leading-[24px] text-grey-70 font-light ${className ?? ""}`}>{children}</span>;
};

export const TagRegular12 = ({ children, className }: { children: React.ReactNode; className?: string }) => {
  return <span className={`text-[12px] leading-[12px] ${className ?? ""}`}>{children}</span>;
};

export const SubtitleLight12 = ({ children, className = "text-grey-70" }: { children: React.ReactNode; className?: string }) => {
  return <span className={`text-[12px] leading-[12px] font-light ${className ?? ""}`}>{children}</span>;
};

export const SubtitleRegular14 = ({ children, className }: { children: React.ReactNode; className?: string }) => {
  return <span className={`text-[14px] leading-[14px] text-blacknew-100 ${className ?? ""}`}>{children}</span>;
};

export const SubtitleRegular16 = ({ children, className = "text-grey-70" }: { children: React.ReactNode; className?: string }) => {
  return <span className={`text-[16px] leading-[16px] ${className ?? ""}`}>{children}</span>;
};

export const SubtitleRegular20 = ({ children, className = "text-grey-70" }: { children: React.ReactNode; className?: string }) => {
  return <span className={`text-[20px] leading-[20px] font-light ${className ?? ""}`}>{children}</span>;
};

export const SkeletonCard = () => {
  return (
    <div className='flex w-full flex-1 flex-col items-center'>
      <div className='animate-pulse flex-row items-center justify-center space-x-1 rounded-xl border p-6 w-full'>
        <div className='flex flex-col space-y-2'>
          <div className='h-6 w-11/12 rounded-md bg-gray-300' />
          <div className='h-6 w-10/12 rounded-md bg-gray-300' />
          <div className='h-6 w-9/12 rounded-md bg-gray-300' />
          <div className='h-6 w-9/12 rounded-md bg-gray-300' />
        </div>
      </div>
    </div>
  );
};
