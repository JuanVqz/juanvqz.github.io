import { Layout, AppLink } from "../components"

const HomePage = () => {
  return (
    <Layout>
      <div className="flex flex-col items-center justify-center min-h-screen py-2">
        <main className="flex flex-col items-center justify-center flex-1 px-20 text-center">
          <h1 className="text-6xl font-bold">
            Welcome to{" "}
            <AppLink href="/articles" className="text-blue-600">
              Articles
            </AppLink>
          </h1>
        </main>
      </div>
    </Layout>
  )
}

export default HomePage
