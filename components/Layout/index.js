import Head from "next/head"

const Layout = ({ children, title = "Home" }) => {
  return (
    <>
      <Head>
        <title>Juan Vasquez | {title}</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      {children}
    </>
  )
}

export default Layout
