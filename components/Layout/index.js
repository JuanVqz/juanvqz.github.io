import Head from "next/head"
import { Footer } from "../../components"

const Layout = ({ children, title = "Home" }) => {
  return (
    <>
      <Head>
        <title>{title} | Juan Vasquez</title>
        <link rel="icon" href="/favicon.ico" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>

      <div className="flex flex-col h-screen bg-white-500 md:bg-blue-500 sm:bg-yellow-500 lg:bg-gray-500 xl:bg-pink-500 2xl:bg-green-500">
        <main className="flex-grow p-4">{children}</main>

        <Footer />
      </div>
    </>
  )
}

export default Layout
