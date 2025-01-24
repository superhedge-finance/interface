import React from "react";
import Head from "next/head";
import Header from "./header/Header";
import Footer from "./footer/Footer";

type LayoutProps = {
  children?: React.ReactNode;
};

const Layout = ({ children }: LayoutProps) => {
  return (
    <>
      <Head>
        <title>Superhedge</title>
        <link rel='icon' href='/fav-32.svg' key='favicon' />
      </Head>
      <main className='w-full bg-[#F7F7F7]'>
        <Header />
        <div className='container mx-auto min-h-[calc(100vh-210px)] p-5 md:p-8'>
          {children}
        </div>
        <Footer />
      </main>
    </>
  );
};
export default Layout;
