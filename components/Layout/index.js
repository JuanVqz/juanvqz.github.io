import Head from "next/head"
import { Footer } from "../../components"

const Layout = ({ children, title = "Home" }) => {
  return (
    <>
      <Head>
        <title>{title} | Juan Vasquez</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main>{children}</main>

      <Footer />
    </>
  )
}

export default Layout
